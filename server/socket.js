var io       = require('socket.io')({path: "/sockets"}),
    qs       = require('querystring'),
    async    = require('async'),
    user_ldap    = require('./modules/user-ldap/app.js'),
    config = require('./config'),
    model = require('./manager.js')
    ;

var structures = {};

// Load schema
var User   = require('./models/user'),
Preference = require('./models/preference'),
Message    = require('./models/message'),
Room       = require('./models/room');

var users = {}, files = {}, navigating_users= {};
var user_ldap = new user_ldap(config, structures);

// socket connection
io.on('connection', function(socket){
  var onevent = socket.onevent;

  // DEBUG
  socket.onevent = function (packet) {
      var args = packet.data || [];
      onevent.call (this, packet);    // original call
      packet.data = ["*"].concat(args);
      onevent.call(this, packet);      // additional call to catch-all
  };
  socket.on("*",function(event,data) {
      console.log(event);
  });
  // END DEBUG

  // Event received by new user
  socket.on('join', function (fn) {
    console.log('socket join');
    var recv = {};

    // Shibboleth auth using handshake's http headers
    recv.user = socket.handshake.headers.remote_user;
    recv.name = decodeURIComponent(escape(socket.handshake.headers.displayname));
    var affectation = socket.handshake.headers.supannentiteaffectation ? socket.handshake.headers.supannentiteaffectation.split(";") : undefined;
    recv.affectations = affectation || ["guest"];
    recv.affectationPrincipale = socket.handshake.headers.supannentiteaffectationprincipale ||
                                 recv.affectations && recv.affectations[0] ||
                                 "guest";

    if(recv.user == undefined){
      recv.user = "guest";
      recv.name = "guest";
    }

    console.log(recv)
    /*if (!recv.user || !recv.name) {
      socket.emit('custom_error', { message: 'User not found or invalid' });
      return;
    }*/

    User.findOne({user: recv.user}, function(err, user){
      if (err) return console.log(err);

      async.parallel({
        getDirection: function(callback){return async.map(recv.affectations, model.getDirection, callback)},
        getLDAPAttributes: function(callback){return user_ldap.getLDAPAttributes(recv.user, callback)}
        }, function(err, results){
          if (!user) {
          var newUser = new User({
              user: recv.user,
              name: recv.name,
              affectationPrincipale: recv.affectationPrincipale,
              directions: results.getDirection,
              eduPersonPrimaryAffiliation: results.getLDAPAttributes.eduPersonPrimaryAffiliation,
              affiliationType: user_ldap.getAffiliationType(results.getLDAPAttributes.eduPersonPrimaryAffiliation),
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
              model.addUserToChat(socket, users, newUser, fn, structures, io);
            });
          });
        }
        // Already registered user
        else {
          user.name = recv.name;
          user.directions = results.getDirection;
          user.affectationPrincipale = recv.affectationPrincipale;
          user.eduPersonPrimaryAffiliation = results.getLDAPAttributes.eduPersonPrimaryAffiliation;
          user.affiliationType = user_ldap.getAffiliationType(results.getLDAPAttributes.eduPersonPrimaryAffiliation);
          user.supannListeRouge = results.getLDAPAttributes.supannListeRouge;
          user.modifyTimestamp = results.getLDAPAttributes.modifyTimestamp;
          user.save(function(err, user){
            if(err) return console.log(err);
            model.addUserToChat(socket, users, user, fn, structures, io);
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
          model.sendFavList(socket, users, updated_user, io);
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
        async.map(results, model.getVisibility, function(err, results){
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

module.exports = io;
