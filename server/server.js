'use strict';

// Configuration
var config = require('./config');
var port = process.env.PORT || config.port;

var http   = require('http'),
io       = require('socket.io')({path: "/sockets"}),
mongoose = require('mongoose'),
request  = require('request'),
fs       = require('fs'),
path     = require('path'),
url      = require('url'),
qs       = require('querystring'),
LDAP     = require('ldap-client'),
async    = require('async');

var users = {}, files = {}, navigating_users= {};

// Load schema
var User   = require('./models/user'),
Preference = require('./models/preference'),
Message    = require('./models/message'),
Room       = require('./models/room');

// LDAP Search for structures
var structures = {};

var ldap = new LDAP({
    uri: config.ldap.uri,
    base: config.ldap.base,
    scope: config.ldap.scope,
    filter: config.ldap.filter,
    attrs: config.ldap.attrs,
    connecttimeout: 5
});

ldap.bind({
  binddn: config.ldap.binddn,
  password: config.ldap.password
  },
  function(err){
    if (err) return console.log(err);
    ldap.search({}, function(err, data){
      if (err) return console.log(err);
      createStructures(data);
      // Update structures every hours
      setInterval(function(){
        ldap.search({}, function(err, data){
          if (err) return console.log(err);
          createStructures(data);
        });
      }, 3600000);
    });
});

function createStructures(data){
  for (var str in data){
    structures[data[str].supannCodeEntite[0]] = data[str].ou && data[str].ou[0] || data[str].supannCodeEntite[0];
  }
  structures["guest"] = "Visiteur";
}

function getDirection(service, callback){
  if (service === "guest"){
    return callback(null, "guest");
  }
  ldap.search({filter: "(supannCodeEntite=" + service + ")"}, function(err, data){
    if (err) return console.log(err);
    if (!data[0].up1Flags || data[0].up1Flags.indexOf("included") === -1){
      return callback(null, service);
    }
    else {
      return getDirection(data[0].supannCodeEntiteParent[0], callback);
    }
  });
}

function getModifyTimestamp(eppn, callback){
  if (eppn.indexOf("univ-paris1") === -1){
    return callback(null, null);
  }
  ldap.search({base: "ou=people,dc=univ-paris1,dc=fr",
    filter: "(eduPersonPrincipalName=" + eppn + ")",
    attrs: "modifyTimestamp"
  }, function(err, data){
    if (err) return console.log(err);
    return callback(null, data[0] && data[0].modifyTimestamp[0]);
  });
}

function sendDirectionList(socket, user){
  var directionList = {};
  for (var usr in users){
    if (String(users[usr].uid) === String(user.uid)) continue;
    if (String(users[usr].direction[0]) === String(user.direction[0])){
      directionList[usr] = {
        'uid': users[usr].uid,
        'user': users[usr].user,
        'name': users[usr].name,
        'status': users[usr].status,
        'service': users[usr].service,
        'direction': users[usr].direction,
        'modifyTimestamp': users[usr].modifyTimestamp
      };
    }
  }
  if (Object.keys(directionList).length > 0)
    socket.emit('chat', JSON.stringify({'action': 'direction_list', 'data': directionList}));
}

function sendFavList(socket, user){
  var favList = {};
  User.find({_id: {$in: user.favorites}}, function(err, fav_list){
    if (err) return console.log(err);
    for (var i in fav_list){
      favList[fav_list[i]._id] = {
        'uid': fav_list[i]._id,
        'user': fav_list[i].user,
        'name': fav_list[i].name,
        'status': users[fav_list[i]._id] && users[fav_list[i]._id].status || 'offline',
        'service': fav_list[i].service,
        'direction': fav_list[i].direction,
        'modifyTimestamp': fav_list[i].modifyTimestamp
      };
    }
    io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'fav_list', 'data': favList}));
  });
}

function sendRoomList(socket, user){
  var roomList = {};

  var findData = function(room, callback){
    async.parallel({
      findPenpal: function(cb){
        var penpalIndice = (String(room.users[0]) === String(user.uid)) ? 1 : 0;
        User.findById(room.users[penpalIndice]).exec(cb);
      },
      findLastMessage: function(cb){
        Message.findOne({room: room._id}).sort({posted: -1}).exec(cb);
      }
    },
    function(err, result){
      if (result.findLastMessage){
        roomList[room._id] = {};
        roomList[room._id].penpal = {
          'uid': result.findPenpal._id,
          'user': result.findPenpal.user,
          'name': result.findPenpal.name,
          'status': users[result.findPenpal._id] && users[result.findPenpal._id].status || 'offline',
          'service': result.findPenpal.service,
          'direction': result.findPenpal.direction,
          'modifyTimestamp': result.findPenpal.modifyTimestamp

        };
        roomList[room._id].lastMessage = result.findLastMessage;
      }
      callback(err);
    });
  }

  Room.find({users: user.uid}, function(err, room_list){
    if (err) return console.log(err);
    async.map(room_list, findData, function(err, result){
      if (err) return console.log(err);
      io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'room_list', 'data': roomList}));
    });
  });
}

function sendPreferences(socket, user){
  Preference.findOne({user: user.uid}, function(err, pref){
    if (err) return console.log(err);
    io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'preferences', 'data': {sound: pref.sound, lang: pref.lang, notification: pref.notification}}));
  });
}

function addUserToChat(socket, user, fn){

  var user_settings = {
    'uid': user._id,
    'user': user.user,
    'name': user.name,
    'status': user.status,
    'service': user.service,
    'direction': user.direction,
    'favorites': user.favorites,
    'modifyTimestamp': user.modifyTimestamp
  };

  if (typeof fn !== 'undefined') {
    fn(JSON.stringify( {'login': 'successful', 'user_props': user_settings}));
  }

  socket.join(String(user_settings.uid));
  socket.user = user_settings.uid;
  users[socket.user] = user_settings;

  sendPreferences(socket, user_settings);
  sendDirectionList(socket, user_settings);
  sendFavList(socket, user_settings);
  sendRoomList(socket, user_settings);

  // Send new user is connected to everyone
  socket.broadcast.emit('chat', JSON.stringify( {'action': 'new_user', 'user': users[socket.user]} ));
}

io.on('connection', function(socket){
  // Event received by new user
  socket.on('join', function (fn) {

    var recv = {};
    // Shibboleth auth using handshake's http headers
    recv.user = socket.handshake.headers.remote_user;
    recv.name = decodeURIComponent(escape(socket.handshake.headers.displayname));
    recv.service = socket.handshake.headers.supannentiteaffectationprincipale;

    if (!recv.user || !recv.name) {
      socket.emit('custom_error', { message: 'User not found or invalid' });
      return;
    }

    if (!recv.service || recv.service.length === 0){
      recv.service = "guest";
    }

    User.findOne({user: recv.user}, function(err, user){
      if (err) return console.log(err);

      async.parallel({
        direction: function(callback){return getDirection(recv.service, callback)},
        modifyTimestamp: function(callback){return  getModifyTimestamp(recv.user, callback)}
        }, function(err, results){
          if (!user) {
          var newUser = new User({
              user: recv.user,
              name: recv.name,
              service: [recv.service, structures[recv.service]],
              direction: [results.direction, structures[results.direction]],
              modifyTimestamp: results.modifyTimestamp
          });
          newUser.save(function(err, newUser) {
            if (err) return console.log(err);
            var newPref = new Preference({user: newUser._id});
            newPref.save(function(err, newPref){
              if (err) return console.log(err);
              addUserToChat(socket, newUser, fn);
            });
          });
        }
        // Already registered user
        else {
          if (recv.name !== user.name){
            user.name = recv.name;
          }
          if (recv.service !== user.service){
              user.service = [recv.service, structures[recv.service]];
              user.direction = [results.direction, structures[results.direction]];
          }
          if (results.modifyTimestamp !== user.modifyTimestamp){
            user.modifyTimestamp = results.modifyTimestamp;
          }
          user.save(function(err, user){
            if(err) return console.log(err);
            addUserToChat(socket, user, fn);
          });
        }
      });
    });
  });

  // Event received when user want change his status
  socket.on('change_status', function (recv, fn) {
    if (users[socket.user]){
      User.update({_id: recv.uid}, {$set: {status: recv.status}}, function(err, updated_user){
        if (err) return console.log(err);
        users[socket.user].status = recv.status;
        socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_change_status', 'user': users[socket.user]}));
        fn();
      });
    }
  });

  socket.on('message_viewed', function(recv){
    Message.findById(recv._id, function(err, message){
      if (users[socket.user].status === "invisible"){
        return;
      }
      message.viewed = true;
      message.save(function(err){
        if (err) return console.log(err);
        io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'update_badge', 'data': message.room}));
        if (users[message.owner] && users[message.owner].uid){
          io.to(users[message.owner].uid).emit('chat', JSON.stringify({'action': 'message_viewed', 'data': message}));
        }
      });
    });
  });

  // Event received when user is typing
  socket.on('user_typing', function (recv) {
    let data = {room: recv.room, penpal_typing: recv.user_typing};
    if (users[recv.receiver] && users[recv.receiver].uid){
      io.to(users[recv.receiver].uid).emit('chat', JSON.stringify({'action': 'penpal_typing', 'data': data}));
    }
  });

  // Event received when user send message to another
  socket.on('send_message', function (recv) {
    Room.findById(recv.room, function(err, room){
      if (err) return console.log(err);
      if (!room) {
        socket.emit('custom_error', { message: 'Error, the message wont be save' });
      }
      else {
        var urlRegex = /https?:\/\/([\w-]{1,63}}\.)?[\w-]{1,63}\.[\w-]{1,63}(:\d{1,5})?\/?([^\ ]*)?/;
        if (!recv.isLink && recv.text.match(urlRegex)){
          var matchedUrl = recv.text.match(urlRegex);
          var preUrl = "", postUrl = "";
          if (matchedUrl.index !== 0){
            preUrl = recv.text.substring(0, matchedUrl.index);
          }
          if (matchedUrl[0].length !== matchedUrl.input.substring(matchedUrl.index)){
            postUrl = recv.text.substring(matchedUrl.index + matchedUrl[0].length);
          }
          recv.text = preUrl + "<a target='_blank' href='" + matchedUrl[0] + "'>" + matchedUrl[0] + "</a>" + postUrl;
          recv.isLink = true;
        }
        var newMessage = new Message({
          room: room._id,
          owner: users[socket.user].uid,
          text: recv.text,
          isLink: recv.isLink
        }).save(function(err, newMessage){
          if (err) return console.log(err);
          io.to(users[socket.user].uid).emit('chat', JSON.stringify( {'action': 'message', 'data': newMessage}));
          if (typeof users[recv.receiver] !== 'undefined'){
            io.to(users[recv.receiver].uid).emit('chat', JSON.stringify( {'action': 'message', 'data': newMessage}));
          }
        });
      }
    });
  });

  function Timer(callback, time) {
    this.setTimeout(callback, time);
  }

  Timer.prototype.setTimeout = function(callback, time) {
    var self = this;
    if(this.timer) {
      clearTimeout(this.timer);
    }
    this.finished = false;
    this.callback = callback;
    this.time = time;
    this.timer = setTimeout(function() {
      self.finished = true;
      callback();
    }, time);
    this.start = Date.now();
  }

  Timer.prototype.add = function(time) {
    if(!this.finished) {
      time = this.time - (Date.now() - this.start) + time;
      this.setTimeout(this.callback, time);
    }
  }

  // Event received when user has disconnected
  socket.on('disconnect', function () {
    var clients = io.sockets.adapter.rooms[socket.user];
    if (typeof clients === "undefined"){
      if (!navigating_users[socket.user]){
        navigating_users[socket.user] = Object.assign({}, users[socket.user]);
        navigating_users[socket.user].timer = new Timer(function(){
          if (!users[socket.user]){
            socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_disconnected', 'user': navigating_users[socket.user]} ));
          }
          delete navigating_users[socket.user];
        }, 5000);
      }
      else if (navigating_users[socket.user] && navigating_users[socket.user].timer) {
        navigating_users[socket.user].timer.add(5000);
      }
      delete users[socket.user];
    }
  });

  socket.on('close_chat', function(){
    if (users[socket.user]) {
      io.to(users[socket.user].uid).emit('chat', JSON.stringify( {'action': 'disconnect_user'}));
      socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_disconnected', 'user': users[socket.user]} ));
      delete users[socket.user];
    }
  });

  socket.on('load_room', function(recv, fn) {
    //Charge une room quand on clique sur un utilisateur
    Room.findOne({users: recv}, function(err, room){
      if(err) return console.log(err);
      if(!room){
        var newRoom = new Room({users: recv}).save(function(err, newRoom){
          if (err) return console.log(err);
          if (typeof fn !== 'undefined')
            fn(JSON.stringify({'room': newRoom._id, 'messages': []}));
        });
      }
      else {
        Message.find({room: room._id}).sort({posted: 1}).exec(function(err, messages){
          if (err) return console.log(err);
          if (typeof fn !== 'undefined'){
            fn(JSON.stringify({'room': room._id, 'messages': messages}));
          }
          if (messages.length > 0){
            var lastMessage = messages[messages.length - 1];
            if (!lastMessage.viewed && String(lastMessage.owner) !== String(users[socket.user].uid)){
              lastMessage.viewed = true;
              lastMessage.save(function(err, updatedMessage){
                if (err) return console.log(err);
                io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'update_badge', 'data': room._id}));
                if (users[updatedMessage.owner] && users[updatedMessage.owner].uid){
                  io.to(users[updatedMessage.owner].uid).emit('chat', JSON.stringify({'action': 'message_viewed', 'data': updatedMessage}));
                }
              });
            }
          }
        });
      }
    });
  });

  socket.on('manage_fav_list', function(recv) {
    if (users[socket.user]){
      User.findById(users[socket.user].uid, function(err, user){
        if (err) return console.log(err);
        if (recv.action == 'add' && user.favorites.indexOf(recv.user) == -1){
          user.favorites.push(recv.user);
        }
        else if (recv.action == 'del' && user.favorites.indexOf(recv.user) != -1) {
          var index = user.favorites.indexOf(recv.user);
          user.favorites.splice(index, 1);
        }
        user.save(function(err, updated_user){
          if (err) return console.log(err);
          sendFavList(socket, updated_user);
        });
      });
    }
  });

  socket.on('search', function(recv, fn) {
    if (users[socket.user]){
      var searchPattern = recv.replace(/\W/g, ".");
      var strRegex = "(^" + searchPattern + ".*)|(\ " + searchPattern + ".*(\ " + searchPattern + ".*)*$)";
      User.find({'name': {'$regex': new RegExp(strRegex, "gim")}}, function(err, results){
        if (err) return console.log(err);
        var users_found = {};
        for (var usr in results){
          if (String(results[usr]._id) === String(users[socket.user].uid)) continue;
          users_found[results[usr]._id] = {
            'uid': results[usr]._id,
            'user': results[usr].user,
            'name': results[usr].name,
            'status': users[results[usr]._id] && users[results[usr]._id].status || "offline",
            'service': results[usr].service,
            'direction': results[usr].direction,
            'modifyTimestamp': results[usr].modifyTimestamp
          }
        }
        if (typeof fn !== 'undefined')
          fn(JSON.stringify({successful: true, users_found}))
      });
    }
  });

  socket.on('save_pref', function(recv){
    if (users[socket.user]){
      Preference.findOne({user: socket.user}, function(err, pref){
          if (err) return console.log(err);
          pref.sound = recv.sound;
          pref.lang = recv.lang;
          pref.notification = recv.notification;
          pref.save(function(err, updatedPref){
            if (err) return console.log(err);
            io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'preferences', 'data': {sound: updatedPref.sound, lang: updatedPref.lang, notification: updatedPref.notification}}));
          });
      });
    }
  });

  socket.on('start_upload', function(recv){
    var upload_dir = path.join(__dirname, "uploads");
    if (!fs.existsSync(upload_dir)){
      fs.mkdirSync(upload_dir);
    }
    files[recv.name] = {};
    files[recv.name].size = recv.size;
    files[recv.name].progress = 0;
    files[recv.name].path = path.join(upload_dir, recv.name);
    var place = 0;
    fs.open(files[recv.name].path, "a", "0755", function(err, fd){
      if (err){
        console.log(err);
      }
      else {
        files[recv.name].handler = fd;
        socket.emit("chat", JSON.stringify({'action': 'send_more_data', 'data': {"place": place, "progress": files[recv.name].progress}}));
      }
    })
  });

  socket.on('upload_file', function(recv, fn) {
    files[recv.name].progress += recv.data.length;
    files[recv.name].data += recv.data;
    // If upload completed, send the file to Filex
    if (files[recv.name].progress === files[recv.name].size){
      fs.write(files[recv.name].handler, files[recv.name].data, null, 'Binary', function(err, writen){
      if (err) return console.log(err);
        var formData = {
          owner: users[recv.owner] && users[recv.owner].user || recv.owner,
          upload: fs.createReadStream(files[recv.name].path)
        };
        request.post({url: config.upload_server, formData: formData}, function(err, res, body){
          if (err) return console.log(err);
          if (body.match(/https:\/\/filex(-test)\.univ-paris1\.fr\/get\?k=[0-9A-za-z]+/)){
            var link = "<a href='" + body + "&auto=1'>" + recv.name + "</a>";
            if (typeof fn !== 'undefined'){
              fn(JSON.stringify({"successful": true, "link": link}));
            }
          }
          fs.unlink(files[recv.name].path, function(err){
            if (err) return console.log(err);
          });
          delete files[recv.name];
        });
      });
    }
    // If the buffer reaches 10 Mb of data, write data and reset buffer
    else if (files[recv.name].data.length > 10485760){
      fs.write(files[recv.name].handler, files[recv.name].data, null, 'Binary', function(err, writen){
        files[recv.name].data = "";
        var place = files[recv.name].progress / 524288;
        var progress = files[recv.name].progress / files[recv.name].size * 100;
        socket.emit("chat", JSON.stringify({'action': 'send_more_data', 'data': {"place": place, "progress": progress}}));
      });
    }
    // Else ask client for more data
    else {
      var place = files[recv.name].progress / 524288;
      var progress = files[recv.name].progress / files[recv.name].size * 100;
      socket.emit("chat", JSON.stringify({'action': 'send_more_data', 'data': {"place": place, "progress": progress}}));
    }
  });

  socket.on('update_roomlist', function(recv, fn){
    Room.findById(recv.room, function(err, room){
      if (err) return console.log(err);
      var penpalUid;
      if (String(recv.owner) === String(socket.user)){
        penpalUid = (String(recv.owner) === String(room.users[0])) ? room.users[1] : room.users[0];
      }
      else {
        penpalUid = recv.owner;
      }
      User.findById(penpalUid, function(err, user){
        if (err) return console.log(err);
        var penpal = {
          'uid': user._id,
          'user': user.user,
          'name': user.name,
          'status': users[user._id] && users[user._id].status || 'offline',
          'service': user.service,
          'direction': user.direction,
          'modifyTimestamp': user.modifyTimestamp
        };
        fn(JSON.stringify({room: recv.room, update: {lastMessage: recv, penpal: penpal}}));
      });
    });
  });

  socket.on('display_notification', function(recv, fn){
    var user_clients = Object.keys(io.sockets.adapter.rooms[socket.user].sockets);
    if (user_clients[0] === socket.id){
      if (recv && recv.uid){
        var penpal_clients = io.sockets.adapter.rooms[recv.uid] && Object.keys(io.sockets.adapter.rooms[recv.uid].sockets);
        switch(recv.action){
          case "connection":
            if (penpal_clients && penpal_clients.length === 1 && !navigating_users[recv.uid]){
              fn();
            }
            break;
          default:
            fn();
        }
      }
      else {
        fn();
      }
    }
  });

  socket.on('check_room_not_empty', function(recv, fn){
    Room.findOne({users: recv}, function(err, room){
      if(err) return console.log(err);
      if (!room){
        fn(false);
      }
      else {
        Message.find({room: room._id}).exec(function(err, messages){
          if (err) return console.log(err);
          if (messages.length > 0){
            fn(room._id);
          }
          else {
            fn(false);
          }
        });
      }
    });
  });

  socket.on('del_conversation', function(recv){
    Message.remove({room: recv.room}).exec(function(err, res){
      if(err) return console.log(err);
      if (res.result && res.result.ok){
        io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'update_del_conversation', 'data': recv.room}));
        if (users[recv.penpal.uid]){
          io.to(users[recv.penpal.uid].uid).emit('chat', JSON.stringify({'action': 'update_del_conversation', 'data': recv.room}));
        }
      }
    });
  });
});

// Launch server
var server = http.createServer(function(req, res){

  var urlParts = url.parse(req.url, true);
  var uri = urlParts.pathname;
  if (uri === "/login") uri = "/";
  var filename = path.join(__dirname, "../client" + uri);

  if (!req.headers.cookie || req.headers.cookie.indexOf('_shibsession_') === -1){
    var idpId = "";
    if (urlParts.query.idpId){
      idpId = "providerId=" + urlParts.query.idpId;
    }
    var target = qs.escape("target=" + config.host + uri);
    var urlForceIdp = config.shib_login + "?" +  idpId + "&" + target;
    res.writeHead(302, {"Location": urlForceIdp});
    res.end();
    return;
  }

  fs.stat(filename, function(err, stat) {
    if (err && err.code === "ENOENT") {
      res.writeHead(404, {"Content-Type": "text/plain"});
      res.write("404 Not Found\n");
      res.end();
      return;
    }
    else if (err){
      console.log(err);
      return;
    }

    if (fs.statSync(filename).isDirectory()){
      filename += '/index.html';
    }

    fs.readFile(filename, "binary", function(err, file) {
      if (err) {
        res.writeHead(500, {"Content-Type": "text/plain"});
        res.write(err + "\n");
        res.end();
        return;
      }

      res.writeHead(200);
      res.write(file, "binary");
      res.end();
    });
  });
});

io.attach(server);

mongoose.connect('mongodb://localhost/p1chat');
var mongoDb = mongoose.connection;
mongoDb.on('error', console.error.bind(console, 'Can\'t connect to MongoDB.'));
mongoDb.on('open', function(){
  console.log('Connected to MongoDB, launch http server...');
  server.listen(port, function () {
    var addr = server.address();
    console.log('Server listening on ' + addr.address + addr.port);
  });
});
