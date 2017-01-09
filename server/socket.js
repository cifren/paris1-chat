var ioG       = require('socket.io')({path: "/sockets"}),
    async    = require('async'),
    config = require('./config'),
    manager = require('./manager.js'),
    EventEmitter = require('events');
    ;

var structures = {};
var users = {}, files = {}, navigating_users= {};

var socketContainer = {
  eventEmitter: new EventEmitter(),
  container: undefined,
  io: ioG,
  user_manager: undefined,
  config: config,
  socket: undefined,
  init: function(){
    this.socketEvent();
    // Allow to add new plugins and run their init for example all at the same time
    this.eventEmitter.emit('plugin', {socketContainer: this});
  },
  socketEvent: function(){
    var eventEmitter = this.eventEmitter;
    var io = this.io = ioG;
    var user_manager = this.user_manager = this.container.user_manager;
    var UserModel = user_manager.getUserModel();
    var PreferenceModel = this.container.preference_model;
    var MessageModel = this.container.message_model;
    var RoomModel = this.container.room_model;
    var _this = this;
    // socket connection
    this.io.on('connection', function(socket){
      _this.socket = socket;
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
        // retrieve or create a user
        user_manager
          .findUser(function(user){
            manager.addUserToChat(socket, users, user, fn, io, UserModel);
          });
      });

      // Event received when user change his status
      socket.on('change_status', function (userRecv) {
        if (users[socket.user_id]){
          UserModel.update({name: userRecv.name}, {$set: {status: userRecv.status}}, function(err, updated_user){
            if(err){return manager.catchMongodbErrorDisplay(err)};
            users[socket.user_id].status = userRecv.status;
            io.to(users[socket.user_id].id).emit('chat', JSON.stringify( {'action': 'set_status', 'data': users[socket.user_id].status} ));

            socket.broadcast.emit('chat', JSON.stringify({
              'action': 'user_changed_status',
              'user': {
                'uid': users[socket.user_id].id,
                'name': users[socket.user_id].name,
                'status': users[socket.user_id].status
              }}));
          });
        }
      });

      socket.on('message_viewed', function(recv){
        MessageModel.findById(recv._id, function(err, message){
          if (users[socket.user_id].status === "invisible"){
            return;
          }
          message.viewed = true;
          message.save(function(err){
            if (err) return console.log(err);
            io.to(users[socket.user_id].id).emit('chat', JSON.stringify({'action': 'update_badge', 'data': message.room}));
            if (users[message.owner] && users[message.owner].id){
              io.to(users[message.owner].id).emit('chat', JSON.stringify({'action': 'message_viewed', 'data': message}));
            }
          });
        });
      });

      // Event received when user is typing
      socket.on('user_typing', function (recv) {
        let data = {room: recv.room, penpal_typing: recv.user_typing};
        if (users[recv.receiver] && users[recv.receiver].id){
          io.to(users[recv.receiver].id).emit('chat', JSON.stringify({'action': 'penpal_typing', 'data': data}));
        }
      });

      // Event received when user send message to another
      socket.on('send_message', function (recv) {
        RoomModel.findById(recv.room, function(err, room){
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
            var newMessage = new MessageModel({
              room: room._id,
              owner: users[socket.user_id]._id,
              text: recv.text,
              isLink: recv.isLink
            }).save(function(err, newMessage){
              if (err) return console.log(err);
              io.to(users[socket.user_id]._id).emit('chat', JSON.stringify( {'action': 'message', 'data': newMessage}));
              if (typeof users[recv.receiver] !== 'undefined'){
                io.to(users[recv.receiver].id).emit('chat', JSON.stringify( {'action': 'message', 'data': newMessage}));
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
        var clients = io.sockets.adapter.rooms[socket.user_id];
        if (users[socket.user_id] && typeof clients === "undefined"){
          if (!navigating_users[socket.user_id]){
            navigating_users[socket.user_id] = {
              uid: users[socket.user_id].id,
              name: users[socket.user_id].name,
              directions: users[socket.user_id].directions,
              affiliationType: users[socket.user_id].affiliationType
            };
            navigating_users[socket.user_id].timer = new Timer(function(){
              if (!users[socket.user_id]){
                socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_disconnected', 'user': navigating_users[socket.user_id]} ));
              }
              delete navigating_users[socket.user_id];
            }, 5000);
          }
          else if (navigating_users[socket.user_id] && navigating_users[socket.user_id].timer) {
            navigating_users[socket.user_id].timer.add(5000);
          }
          delete users[socket.user_id];
        }
      });

      socket.on('close_chat', function(){
        if (users[socket.user_id]) {
          io.to(users[socket.user_id].id).emit('chat', JSON.stringify( {'action': 'disconnect_user'}));
          socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_disconnected', 'user': {'uid': users[socket.user_id].id, 'name': users[socket.user_id].name, 'directions': users[socket.user_id].directions, 'affiliationType': users[socket.user_id].affiliationType}}));
          delete users[socket.user_id];
        }
      });

      socket.on('load_room', function(recv, fn) {
        //Charge une room quand on clique sur un utilisateur
        RoomModel.findOne({users: recv}, function(err, room){
          if(err) return console.log(err);
          if(!room){
            var newRoom = new RoomModel({users: recv}).save(function(err, newRoom){
              if (err) return console.log(err);
              if (typeof fn !== 'undefined')
                fn(JSON.stringify({'room': newRoom._id, 'messages': []}));
            });
          }
          else {
            MessageModel.find({room: room._id}).sort({posted: 1}).exec(function(err, messages){
              if (err) return console.log(err);
              if (typeof fn !== 'undefined'){
                fn(JSON.stringify({'room': room._id, 'messages': messages}));
              }
              if (messages.length > 0){
                var lastMessage = messages[messages.length - 1];
                if (!lastMessage.viewed && String(lastMessage.owner) !== String(users[socket.user_id].id)){
                  lastMessage.viewed = true;
                  lastMessage.save(function(err, updatedMessage){
                    if (err) return console.log(err);
                    io.to(users[socket.user_id].id).emit('chat', JSON.stringify({'action': 'update_badge', 'data': room._id}));
                    if (users[updatedMessage.owner] && users[updatedMessage.owner].id){
                      io.to(users[updatedMessage.owner].id).emit('chat', JSON.stringify({'action': 'message_viewed', 'data': updatedMessage}));
                    }
                  });
                }
              }
            });
          }
        });
      });

      socket.on('manage_fav_list', function(recv) {
        if (users[socket.user_id]){
          UserModel.findById(users[socket.user_id].id, function(err, user){
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
              manager.sendFavList(socket, users, updated_user, io, UserModel);
            });
          });
        }
      });

      socket.on('search', function(recv, fn) {
        if (users[socket.user_id]){
          var searchPattern = recv.replace(/\W/g, ".");
          var strRegex = "(^" + searchPattern + ".*)|(\ " + searchPattern + ".*(\ " + searchPattern + ".*)*$)";
          UserModel.find({'name': {'$regex': new RegExp(strRegex, "gim")}}, function(err, results){
            if (err) return console.log(err);
            var users_found = {};
            async.map(results, manager.getVisibility, function(err, results){
              for (var usr in results){
                if (String(results[usr]._id) === String(users[socket.user_id].id)){
                  continue;
                }
                if (results[usr].unlisted){
                  continue;
                }
                users_found[results[usr]._id] = {
                  'uid': results[usr]._id,
                  'name': results[usr].name,
                  'status': users[results[usr]._id] && users[results[usr]._id].status || "offline",
                  'unlisted': results[usr].unlisted
                }
                // Allow to edit the list before sending it, won't support promises into 'on'
                eventEmitter.emit('search', {'user_list': users_found, 'current_user': users[socket.user_id]});
              }
              if (typeof fn !== 'undefined'){
                fn(JSON.stringify({successful: true, users_found}))
              }
            });
          }).limit(50);
        }
      });

      socket.on('save_pref', function(recv){
        if (users[socket.user_id]){
          PreferenceModel.findOne({user: socket.user_id}, function(err, pref){
              if (err) return console.log(err);
              pref.sound = recv.sound;
              pref.lang = recv.lang;
              pref.notification = recv.notification;
              pref.visibility = recv.visibility;
              pref.save(function(err, updatedPref){
                if (err) return console.log(err);
                io.to(users[socket.user_id].id).emit('chat', JSON.stringify({'action': 'preferences', 'data': {sound: updatedPref.sound, lang: updatedPref.lang, notification: updatedPref.notification, visibility: updatedPref.visibility}}));
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
        RoomModel.findById(recv.room, function(err, room){
          if (err) return console.log(err);
          var penpalUid;
          if (String(recv.owner) === String(socket.user_id)){
            penpalUid = (String(recv.owner) === String(room.users[0])) ? room.users[1] : room.users[0];
          }
          else {
            penpalUid = recv.owner;
          }
          UserModel.findById(penpalUid, function(err, user){
            if (err) return console.log(err);
            var penpal = {
              'uid': user._id,
              'name': user.name,
              'status': users[user._id] && users[user._id].status || 'offline',
              'unlisted': user.unlisted
            };
            fn(JSON.stringify({room: recv.room, update: {lastMessage: recv, penpal: penpal}}));
          });
        });
      });

      socket.on('display_notification', function(recv, fn){
        var user_clients = Object.keys(io.sockets.adapter.rooms[socket.user_id].sockets);
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
        RoomModel.findOne({users: recv}, function(err, room){
          if(err) return console.log(err);
          if (!room){
            fn(false);
          }
          else {
            MessageModel.find({room: room._id}).exec(function(err, messages){
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
        MessageModel.remove({room: recv.room}).exec(function(err, res){
          if(err) return console.log(err);
          if (res.result && res.result.ok){
            io.to(users[socket.user_id].id).emit('chat', JSON.stringify({'action': 'update_del_conversation', 'data': recv.room}));
            if (users[recv.penpal.uid]){
              io.to(users[recv.penpal.uid].id).emit('chat', JSON.stringify({'action': 'update_del_conversation', 'data': recv.room}));
            }
          }
        });
      });
    });
  }
}

module.exports = socketContainer;
