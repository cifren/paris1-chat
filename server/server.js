'use strict';

// Configuration
var config = require('./config');
var reverse_proxy_auth = true;
var avatar_url = "https://photo-ldap.univ-paris1.fr/ldap.php?test=1&uid=";

var port = process.env.PORT || 6000;

var server   = require('http').createServer(),
io       = require('socket.io').listen(server),
mongoose = require('mongoose'),
request  = require('request'),
fs       = require('fs'),
LDAP     = require('ldap-client');

var users = {}, files = {};

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
}

function get_avatar_url(user) {
  var ldapUid = user.split('@')[0];
  return avatar_url + ldapUid;
}

function getDirection(service){
  if (service.length < 4)
    return service
  else
    return service.substring(0, 3);
}

function sendUserInfo(socket, user, fn){

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
        'avatar': users[usr].avatar,
        'service': users[usr].service,
        'direction': users[usr].direction
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
        'avatar': fav_list[i].avatar,
        'service': fav_list[i].service,
        'direction': fav_list[i].direction
      };
    }
    io.to(users[socket.user].uid).emit('chat', JSON.stringify({'action': 'fav_list', 'data': favList}));
  });
}

function addUserToChat(socket, user, fn){

  var user_settings = {
    'uid': user._id,
    'user': user.user,
    'name': user.name,
    'status': user.status,
    'avatar': user.avatar,
    'service': user.service,
    'direction': user.direction,
    'favorites': user.favorites
  };

  if (typeof fn !== 'undefined') {
    fn(JSON.stringify( {'login': 'successful', 'user_props': user_settings}));
  }

  socket.join(String(user_settings.uid));

  sendDirectionList(socket, user_settings);
  sendFavList(socket, user_settings);

  socket.user = user_settings.uid;
  users[socket.user] = user_settings;

  // Send new user is connected to everyone
  socket.broadcast.emit('chat', JSON.stringify( {'action': 'new_user', 'user': users[socket.user]} ));
}

io.on('connection', function(socket){
  // Event received by new user
  socket.on('join', function (fn) {

    var recv = {};
    if (reverse_proxy_auth) {
      // Shibboleth auth using handshake's http headers
      recv.user = socket.handshake.headers.eppn;
      recv.name = socket.handshake.headers.displayname;
      recv.service = socket.handshake.headers.supannentiteaffectationprincipale;
    }

    if (!recv.user || !recv.name) {
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
            name: recv.name,
            avatar: get_avatar_url(recv.user),
            service: [recv.service, structures[recv.service]],
            direction: [getDirection(recv.service), structures[getDirection(recv.service)]]
          });
          newUser.save(function(err, newUser) {
            if (err) return console.log(err);
            addUserToChat(socket, newUser, fn);
          });
        });
      }
      // Already registered user
      else {
        Preference.findById(user.preferences, function(err, pref){
          if (err) return console.log(err);
          socket.emit('preferences', JSON.stringify(pref));
        });

        if (recv.name != user.name)
          user.name = recv.name;
        if (recv.service != user.service){
            user.service = [recv.service, structures[recv.service]];
            user.direction = [getDirection(recv.service), structures[getDirection(recv.service)]];
        }
        user.save(function(err, user){
          if(err) return console.log(err);
          addUserToChat(socket, user, fn);
        });
      }
    });
  });

  // Event received when user want change his status
  socket.on('user_status', function (recv) {
    User.update({_id: recv.uid}, {$set: {status: recv.status}}, function(err, updated_user){
      if (err) return console.log(err);
      users[socket.user].status = recv.status;
      socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_change_status', 'user': users[socket.user]} ));
    });
  });

  // Event received when user is typing
  // socket.on('user_typing', function (recv) {
  //   var id = socks[recv.user] && socks[recv.user].socket.id;
  //   if (typeof id !== 'undefined')
  //     socks[recv.user].emit('chat', JSON.stringify( {'action': 'user_typing', 'data': users[socket.user]} ));
  // });

  // Event received when user send message to another
  socket.on('send_message', function (recv) {
    Room.findById(recv.room, function(err, room){
      if (err) return console.log(err);
      if (!room) {
        socket.emit('custom_error', { message: 'Error, the message wont be save' });
      }
      else {
        var newMessage = new Message({
          room: room._id,
          owner: users[socket.user].uid,
          text: recv.text
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

  // Event received when user has disconnected
  socket.on('disconnect', function () {
    if (users[socket.user]) {
      socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_disconnected', 'user': users[socket.user]} ));
      delete users[socket.user];
    }
  });

  socket.on('load_room_users', function(recv, fn) {
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
        Message.find({room: room._id}, function(err, messages){
          if (err) return console.log(err);
          if (typeof fn !== 'undefined')
            fn(JSON.stringify({'room': room._id, 'messages': messages}));
        });
      }
    });
  });

  socket.on('load_room_id', function(recv, fn) {
    var fn_data = {room: recv};
    Room.findById(recv, function(err, room){
      if (err) return console.log(err);
      User.find({_id: {$in: room.users}}, function(err, tab_users){
        if (err) return console.log(err);
        var i = (String(tab_users[0]._id) === String(users[socket.user].uid)) ? 1 : 0;
        var penpal = {
          'uid': tab_users[i]._id,
          'user': tab_users[i].user,
          'name': tab_users[i].name,
          'status': tab_users[i].status,
          'avatar': tab_users[i].avatar,
          'service': tab_users[i].service,
          'direction': tab_users[i].direction,
          'favorites': tab_users[i].favorites
        }
        fn_data.penpal = penpal;
        Message.find({room: room._id}, function(err, messages){
          if (err) return console.log(err);
          fn_data.messages = messages;
          if (typeof fn !== 'undefined'){
            fn(JSON.stringify(fn_data));
          }
        });
      });
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
      User.find({'name': {'$regex': new RegExp(recv, "i")}}, function(err, results){
        if (err) return console.log(err);
        var users_found = {};
        for (var usr in results){
          if (String(results[usr]._id) === String(users[socket.user].uid)) continue;
          users_found[results[usr]._id] = {
            'uid': results[usr]._id,
            'user': results[usr].user,
            'name': results[usr].name,
            'status': users[results[usr]._id] && users[results[usr]._id].status || "offline",
            'avatar': results[usr].avatar,
            'service': results[usr].service,
            'direction': results[usr].direction
          }
        }
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
