'use strict';

// Configuration
var reverse_proxy_auth = true;
var avatar_url = "https://photo-ldap.univ-paris1.fr/ldap.php?test=1&uid=";

var port = process.env.PORT || 6000;

var server   = require('http').createServer(),
io       = require('socket.io').listen(server),
mongoose = require('mongoose'),
request  = require('request'),
fs       = require('fs');

var users = {}, socks = {}, files = {};

// Load schema
var User   = require('./models/user'),
Preference = require('./models/preference'),
Message    = require('./models/message'),
Room       = require('./models/room');

function checkCustomPref(userPref){
  var default_pref = {
    'lang': 'fr',
    'theme': 'paris1-ent',
    'sound': true
  };

  if (userPref.custom_message) return true;
  for (var pref in default_pref){
    if (userPref[pref] !== default_pref[pref]){
      return true;
    }
  }
}

// Generate url for avatar purpose
function get_avatar_url(user) {
  var ldapUid = user.split('@')[0];
  return avatar_url + ldapUid;
}

function addUserToChat(socket, user, fn){

    if (typeof fn !== 'undefined') {
      fn(JSON.stringify( {'login': 'successful', 'my_settings': {
        'uid': user._id,
        'user': user.user,
        'name': user.displayName,
        'status': user.status,
        'avatar': user.avatar,
        'service': user.service,
        'favorites': user.favorites
        }
      }));
    }

    // If there is users online, send the list of them
    if (Object.keys(users).length > 0)
      socket.emit('chat', JSON.stringify( { 'action': 'usrlist', 'user': users } ));

    // If user has a fav list, send the list of them
    if (user.favorites.length > 0){
      User.find({_id: {$in: user.favorites}}, function(err, fav_users){
        if (err) return console.log(err);
        var favlist = [];
        for (var i in fav_users){
          favlist[i] = {uid: fav_users[i]._id, user: fav_users[i].user, name: fav_users[i].displayName, status: fav_users[i].status}
        }
        socket.emit('chat', JSON.stringify({'action': 'favlist', 'favorites': favlist}));
      });
    }

    socket.user = user.user;
    users[socket.user] = {'uid': user._id, 'user': socket.user, 'name': user.displayName, 'status': user.status, 'avatar': user.avatar, 'service': user.service}
    socks[socket.user] = {'socket': socket}

    // Send new user is connected to everyone
    socket.broadcast.emit('chat', JSON.stringify( {'action': 'newuser', 'user': users[socket.user]} ));
}

//Handle users
io.sockets.on('connection', function (socket) {

  // Event received by new user
  socket.on('join', function (recv, fn) {

    if (reverse_proxy_auth) {
      // Shibboleth auth using handshake's http headers
      recv.user = socket.manager.handshaken[socket.id].headers && socket.manager.handshaken[socket.id].headers.eppn;
      recv.name = socket.manager.handshaken[socket.id].headers && socket.manager.handshaken[socket.id].headers.displayname;
      recv.service = socket.manager.handshaken[socket.id].headers && socket.manager.handshaken[socket.id].headers.supannentiteaffectationprincipale;
    }

    if (!recv.user) {
      socket.emit('custom_error', { message: 'User not found or invalid' });
      return;
    }

    User.findOne({user: recv.user}, function(err, user){
      if (err) return console.log(err);
      // Create a new user
      if (!user) {
        var newPref = new Preference().save(function(err, pref){
          if (err) console.log(err);
          var newUser = new User({
            user: recv.user,
            displayName: recv.name,
            service: recv.service,
            preferences: pref,
            avatar: get_avatar_url(recv.user)
          });
          newUser.save(function(err, newUser) {
            if (err) return console.log(err);
            addUserToChat(socket, newUser, fn);
          });
        });
      }
      else {
        // The user is already logged
        // if (users[recv.user]) {
        //   socket.emit('custom_error', { message: 'The user '+ recv.user +' is already logged' });
        //   return;
        // }

        //Envoyer les préférences de l'utilisateur
        Preference.findById(user.preferences, function(err, pref){
          if (err) return console.log(err);
          if (checkCustomPref(pref)) socket.emit('preferences', JSON.stringify(pref));
        });

        if (recv.name != user.displayName)
          user.displayName = recv.name;
        if (recv.service != user.service)
          user.service = recv.service;
        user.status = 'online';
        user.save(function(err, user){
          if(err) return console.log(err);
          addUserToChat(socket, user, fn);
        });
      }
    });
  });

  // Event received when user want change his status
  socket.on('user_status', function (recv) {
    if (users[socket.user]) {
      users[socket.user].status = recv.status;
      console.log(recv);
      // Sauvegarde le nouveau status en base
      User.findOne({user: users[socket.user].user}, function(err, user){
        if (err) return console.log(err);
        user.status = recv.status;
        user.save(function(err, updated_user){
          socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_status', 'user': users[socket.user]} ));
        });
      });
    }
  });

  // Event received when user is typing
  socket.on('user_typing', function (recv) {
    var id = socks[recv.user] && socks[recv.user].socket.id;
    if (typeof id !== 'undefined')
      io.sockets.socket(id).emit('chat', JSON.stringify( {'action': 'user_typing', 'data': users[socket.user]} ));
  });

  // Event received when user send message to another
  socket.on('message', function (recv, fn) {
    Room.findById(recv.room, function(err, room){
      if (err) return console.log(err);
      if (!room) {
        socket.emit('custom_error', { message: 'Error, the message wont be save' });
      }
      else {
        var newMessage = new Message({
          room: room._id,
          owner: users[socket.user].uid,
          text: recv.msg
        }).save(function(err, newMessage){
          if (err) return console.log(err);
          if (typeof fn !== 'undefined')
            fn(JSON.stringify( {'ack': 'true', 'date': newMessage.posted} ));
          var id = socks[recv.user] && socks[recv.user].socket.id;
          if (typeof id !== 'undefined')
            io.sockets.socket(id).emit('chat', JSON.stringify( {'action': 'message', 'data': {'msg': newMessage.text, 'user': users[socket.user]}, 'date': newMessage.posted} ));
        });
      }
    });
  });

  // Event received when user has disconnected
  socket.on('disconnect', function () {
    if (users[socket.user]) {
      socket.broadcast.emit('chat', JSON.stringify( {'action': 'disconnect', 'user': users[socket.user]} ));
      var status_disconnected = {status: 'offline'};
      User.update({_id: users[socket.user].uid}, {$set: status_disconnected}, function(err, updatedDoc){
        if(err) return console.log(err);
      });
      delete users[socket.user];
      delete socks[socket.user];
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
            fn(JSON.stringify({'room': newRoom._id}));
        });
      }
      else {
        User.find({_id: {$in: recv}}, function(err, tab_users){
          if (err) return console.log(err);
          var users = {};
          for (var user in tab_users){
            users[tab_users[user]._id] = {displayName: tab_users[user].displayName, avatar: tab_users[user].avatar};
          }
          Message.find({room: room._id}, function(err, messages){
            if (err) return console.log(err);
            if (typeof fn !== 'undefined')
              fn(JSON.stringify({'room': room._id, 'messages': messages, 'users': users}));
          });
        });
      }
    });
  });

  socket.on('save_user_options', function (recv) {
    if (users[socket.user]){
      User.findById(users[socket.user].uid, function(err, user){
        if (err) return console.log(err);
        Preference.update({_id: user.preferences}, {$set: recv}, function(err, updatedDoc){
          if(err) return console.log(err);
        });
      });
    }
  });

  socket.on('favorite', function(recv, fn) {
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
          if(err) return console.log(err);
          if (typeof fn !== 'undefined')
            fn(JSON.stringify({successful: true, favorites: updated_user.favorites}));
        });
      });
    }
  });

  socket.on('search', function(recv, fn) {
    if (users[socket.user]){
      User.find({'displayName': {'$regex': new RegExp(recv.filter, "i")}}, function(err, results){
        if (err) return console.log(err);

        var users_found = [];
        for (var i in results)
          users_found[i] = {uid: results[i]._id, user: results[i].user, name: results[i].displayName, status: results[i].status}

        if (typeof fn !== 'undefined')
          fn(JSON.stringify({successful: true, users_found}))
      });
    }
  });

  socket.on('upload_file', function(recv, fn) {
    var file_loc = "uploads/" + recv.name;
    fs.writeFile(file_loc, recv.data, function(err){
      if (err) return console.log(err);
      var formData = {
        owner: recv.owner,
        upload: fs.createReadStream(file_loc)
      };
      request.post({url: 'https://filex-test.univ-paris1.fr/trusted-upload', formData: formData}, function(err, res, body){
        if (err) return console.log(err);
        if (body.match(/https:\/\/filex(-test)\.univ-paris1\.fr\/get\?k=[0-9A-za-z]+/)){
          if (typeof fn !== 'undefined')
            fn(JSON.stringify({successful: true, link: body}));
        }
        fs.unlink(file_loc, function(err){
          if (err) return console.log(err);
        });
      });
    });
  });
});

// Launch server
mongoose.connect('mongodb://localhost/jqchat');
var mongoDb = mongoose.connection;
mongoDb.on('error', console.error.bind(console, 'Can\'t connect to MongoDB.'));
mongoDb.on('open', function(){
  console.log('Connected to MongoDB, launch http server...');
  server.listen(port, function () {
    var addr = server.address();
    console.log('Server listening on ' + addr.address + addr.port);
  });
});
