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

// Load schema
var User   = require('./models/user'),
Preference = require('./models/preference'),
Message    = require('./models/message'),
Room       = require('./models/room');

var users = {}, files = {}, structures = {},  navigating_users= {};

var staffAffiliation = ["staff", "teacher", "researcher", "emeritus", "retired"],
studentAffiliation = ["student", "alum"];

var ldap = new LDAP({
    uri: config.ldap.uri,
    base: config.ldap.baseStr,
    scope: config.ldap.scope,
    filter: config.ldap.filter,
    attrs: config.ldap.attrsStr,
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
      return callback(err, service);
    }
    else {
      return getDirection(data[0].supannCodeEntiteParent[0], callback);
    }
  });
}

function getAffiliationType(affiliation){
  var affiliationType = (staffAffiliation.indexOf(affiliation) >= 0) ? "staff" : null;
  if (!affiliationType) affiliationType = (studentAffiliation.indexOf(affiliation) >= 0) ? "student" : "guest";
  return affiliationType;
}

function getVisibility(user, callback){
  Preference.findOne({user: user._id}, function(err, pref){
    if (err) return console.log(err);
    user.visibility = pref.visibility;
    callback(err, user)
  });
}

function getLDAPAttributes(eppn, callback){
  if (eppn.indexOf("univ-paris1") === -1){
    return callback(null, {
      eduPersonPrimaryAffiliation: "guest",
      supannListeRouge: false
    });
  }
  ldap.search({base: config.ldap.basePeople,
    filter: "(eduPersonPrincipalName=" + eppn + ")",
    attrs: config.ldap.attrsPeople
  }, function(err, data){
    if (err) return console.log(err);
    var results = {
      eduPersonPrimaryAffiliation: data[0] && data[0].eduPersonPrimaryAffiliation[0],
      supannListeRouge: data[0] && (data[0].supannListeRouge[0] === "TRUE") ? true : false,
      modifyTimestamp: data[0] && data[0].modifyTimestamp[0]
    };
    return callback(err, results);
  });
}

function sendDirectionLists(socket, user){
  var directionLists = {};
  function findUsersByDirection(direction, callback){
    User.find({directions: direction, affiliationType: user.affiliationType}, function(err, user_list){
      if (err) return console.log(err);
      var directionList = {name: structures[direction], code: direction, list: {}};
      for (var i in user_list){
        if (String(user.uid) === String(user_list[i]._id)){
          continue;
        }
        else if (!users[user_list[i]._id]){
          continue;
        }
        else if (user_list[i].listeRouge && user.affiliationType !== "staff"){
          continue;
        }
        directionList.list[user_list[i]._id] = {
          'uid': user_list[i]._id,
          'user': user_list[i].user,
          'name': user_list[i].name,
          'status': users[user_list[i]._id].status,
          'listeRouge': users[user_list[i]._id].supannListeRouge,
          'modifyTimestamp': user_list[i].modifyTimestamp
        };
      }
      callback(err, directionList);
    });
  }

  async.map(user.directions, findUsersByDirection, function(err, direction_lists){
    for (var i in direction_lists){
      directionLists[direction_lists[i].code] = direction_lists[i];
    }
    if (Object.keys(directionLists).length > 0){
      socket.emit('chat', JSON.stringify({'action': 'direction_list', 'data': directionLists}));
    }
  });
}

function sendFavList(socket, user){
  var favList = {};
  User.find({_id: {$in: user.favorites}}, function(err, fav_list){
    if (err) return console.log(err);
    for (var i in fav_list){
      if (fav_list[i].supannListeRouge && user.affiliationType !== "staff"){
        user.favorites.splice(user.favorites.indexOf(fav_list[i]._id), 1);
        user.save();
        continue;
      }
      favList[fav_list[i]._id] = {
        'uid': fav_list[i]._id,
        'user': fav_list[i].user,
        'name': fav_list[i].name,
        'status': users[fav_list[i]._id] && users[fav_list[i]._id].status || 'offline',
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
        var penpalIndice = (String(room.users[0]) === String(user._id)) ? 1 : 0;
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
          'listeRouge': result.findPenpal.supannListeRouge,
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
  Preference.findOne({user: user._id}, function(err, pref){
    if (err) return console.log(err);
    io.to(users[socket.user].uid).emit('chat', JSON.stringify({action: 'preferences', data: {
      sound: pref.sound,
      lang: pref.lang,
      notification: pref.notification,
      visibility: pref.visibility
    }}));
  });
}

function addUserToChat(socket, user, fn){

  var send_to_client = {
    'uid': user._id,
    'user': user.user,
    'name': user.name,
    'status': user.status,
    'service': user.affectationPrincipale,
    'directions': user.directions,
    'directionsLabels': user.directions.map(function(direction){
      return structures[direction];
    }),
    'favorites': user.favorites,
    'affiliationType': user.affiliationType,
    'listeRouge': user.supannListeRouge,
    'modifyTimestamp': user.modifyTimestamp
  };

  if (typeof fn !== 'undefined') {
    fn(JSON.stringify( {'login': 'successful', 'user_props': send_to_client}));
  }

  user.uid = user._id;

  socket.join(String(user.uid));
  socket.user = user.uid;
  users[socket.user] = user;

  sendPreferences(socket, user);
  sendDirectionLists(socket, user);
  sendFavList(socket, user);
  sendRoomList(socket, user);

  var send_to_broadcast = {
    'uid': user._id,
    'user': user.user,
    'name': user.name,
    'status': user.status,
    'directions': user.directions,
    'affiliationType': user.affiliationType,
    'listeRouge': user.supannListeRouge,
    'modifyTimestamp': user.modifyTimestamp
  };

  socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_connected', 'user': send_to_broadcast} ));
}

io.on('connection', function(socket){
  // Event received by new user
  socket.on('join', function (fn) {

    var recv = {};

    // Shibboleth auth using handshake's http headers
    recv.user = socket.handshake.headers.remote_user;
    recv.name = decodeURIComponent(escape(socket.handshake.headers.displayname));
    recv.affectations = socket.handshake.headers.supannentiteaffectation.split(";") || ["guest"];
    recv.affectationPrincipale = socket.handshake.headers.supannentiteaffectationprincipale ||
                                 recv.affectations && recv.affectations[0] ||
                                 "guest";

    if (!recv.user || !recv.name) {
      socket.emit('custom_error', { message: 'User not found or invalid' });
      return;
    }

    User.findOne({user: recv.user}, function(err, user){
      if (err) return console.log(err);

      async.parallel({
        getDirection: function(callback){return async.map(recv.affectations, getDirection, callback)},
        getLDAPAttributes: function(callback){return  getLDAPAttributes(recv.user, callback)}
        }, function(err, results){
          if (!user) {
          var newUser = new User({
              user: recv.user,
              name: recv.name,
              affectationPrincipale: recv.affectationPrincipale,
              directions: results.getDirection,
              eduPersonPrimaryAffiliation: results.getLDAPAttributes.eduPersonPrimaryAffiliation,
              affiliationType: getAffiliationType(results.getLDAPAttributes.eduPersonPrimaryAffiliation),
              listeRouge: results.getLDAPAttributes.supannListeRouge,
              modifyTimestamp: results.getLDAPAttributes.modifyTimestamp
          });
          newUser.save(function(err, newUser) {
            if (err) return console.log(err);
            var visibility;
            if (staffAffiliation.indexOf(newUser.eduPersonPrimaryAffiliation) >= 0){
              visibility = "staff";
            }
            else {
              visibility = "everybody";
            }
            var newPref = new Preference({
              user: newUser._id,
              visibility: visibility
            });
            newPref.save(function(err, newPref){
              if (err) return console.log(err);
              addUserToChat(socket, newUser, fn);
            });
          });
        }
        // Already registered user
        else {
          user.name = recv.name;
          user.directions = results.getDirection;
          user.affectationPrincipale = recv.affectationPrincipale;
          user.eduPersonPrimaryAffiliation = results.getLDAPAttributes.eduPersonPrimaryAffiliation;
          user.affiliationType = getAffiliationType(results.getLDAPAttributes.eduPersonPrimaryAffiliation);
          user.supannListeRouge = results.getLDAPAttributes.supannListeRouge;
          user.modifyTimestamp = results.getLDAPAttributes.modifyTimestamp;
          user.save(function(err, user){
            if(err) return console.log(err);
            addUserToChat(socket, user, fn);
          });
        }
      });
    });
  });

  // Event received when user change his status
  socket.on('change_status', function (recv) {
    if (users[socket.user]){
      User.update({_id: recv.uid}, {$set: {status: recv.status}}, function(err, updated_user){
        if (err) return console.log(err);
        users[socket.user].status = recv.status;
        io.to(users[socket.user].uid).emit('chat', JSON.stringify( {'action': 'set_status', 'data': users[socket.user].status} ));
        socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_changed_status', 'user': {'uid': users[socket.user].uid, 'name': users[socket.user].name, 'directions': users[socket.user].directions, 'affiliationType': users[socket.user].affiliationType, 'status': users[socket.user].status}}));
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
    if (users[socket.user] && typeof clients === "undefined"){
      if (!navigating_users[socket.user]){
        navigating_users[socket.user] = {
          uid: users[socket.user].uid,
          name: users[socket.user].name,
          directions: users[socket.user].directions,
          affiliationType: users[socket.user].affiliationType
        };
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
      socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_disconnected', 'user': {'uid': users[socket.user].uid, 'name': users[socket.user].name, 'directions': users[socket.user].directions, 'affiliationType': users[socket.user].affiliationType}}));
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
        async.map(results, getVisibility, function(err, results){
          for (var usr in results){
            if (String(results[usr]._id) === String(users[socket.user].uid)){
              continue;
            }
            if (results[usr].supannListeRouge && !users[socket.user].affiliationType === "staff"){
              continue;
            }
            switch (results[usr].visibility){
              case "direction":
                var isInDirection = false;
                for (var i in results[usr].directions){
                  if (users[socket.user].directions.indexOf(results[usr].directions[i]) !== -1){
                    isInDirection = true;
                  }
                }
                if (!isInDirection){
                  continue;
                }
                break;
              case "student":
                if (studentAffiliation.indexOf(users[socket.user].eduPersonPrimaryAffiliation) === -1){
                  continue;
                }
                break;
              case "staff":
                if (staffAffiliation.indexOf(users[socket.user].eduPersonPrimaryAffiliation) === -1){
                  continue;
                }
                break;
            }
            users_found[results[usr]._id] = {
              'uid': results[usr]._id,
              'user': results[usr].user,
              'name': results[usr].name,
              'status': users[results[usr]._id] && users[results[usr]._id].status || "offline",
              'affectationPrincipale': structures[results[usr].affectationPrincipale],
              'listeRouge': results[usr].supannListeRouge,
              'modifyTimestamp': results[usr].modifyTimestamp
            }
          }
          if (typeof fn !== 'undefined'){
            fn(JSON.stringify({successful: true, users_found}))
          }
        });
      }).limit(50);
    }
  });

  socket.on('save_pref', function(recv){
    if (users[socket.user]){
      Preference.findOne({user: socket.user}, function(err, pref){
          if (err) return console.log(err);
          pref.sound = recv.sound;
          pref.lang = recv.lang;
          pref.notification = recv.notification;
          pref.visibility = recv.visibility;
          pref.save(function(err, updatedPref){
            if (err) return console.log(err);
            io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'preferences', 'data': {sound: updatedPref.sound, lang: updatedPref.lang, notification: updatedPref.notification, visibility: updatedPref.visibility}}));
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
      if (err) return console.log(err);
      files[recv.name].handler = fd;
      socket.emit("chat", JSON.stringify({'action': 'send_more_data', 'data': {"place": place, "progress": files[recv.name].progress}}));
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
          'listeRouge': user.supannListeRouge,
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
          case "connect":
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
  var filename = path.join(__dirname, "../client/build/" + uri);
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

      res.writeHead(200, {"Cache-Control": "max-age=0"});
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
