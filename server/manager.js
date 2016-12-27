var async = require('async'),
    cookie = require('cookie');
// Load schema
    User   = require('./models/user'),
    Preference = require('./models/preference'),
    Message    = require('./models/message'),
    Room       = require('./models/room');

function createStructures(data, structures){
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

function getVisibility(user, callback){
  Preference.findOne({user: user._id}, function(err, pref){
    if (err) return console.log(err);
    callback(err, user)
  });
}

function sendRoomList(socket, users, user, io){
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

  Room.find({users: user._id}, function(err, room_list){
    if (err) return console.log(err);
    async.map(room_list, findData, function(err, result){
      if (err) return console.log(err);
      io.to(users[socket.user_id]._id).emit('chat', JSON.stringify({'action': 'room_list', 'data': roomList}));
    });
  });
}

function addUserToChat(socket, users, user, fn, io){
  var send_to_client = {
    'uid': user._id,
    'name': user.name,
    'status': user.status,
    'favorites': user.favorites,
    'unlisted': user.unlisted
  };

  if (typeof fn !== 'undefined') {
    fn(JSON.stringify( {'login': 'successful', 'user_props': send_to_client}));
  }
  socket.join(String(user._id));
  socket.user_id = user._id;
  users[socket.user_id] = user;

  sendPreferences(socket, users, user, io);
  //sendDirectionLists(socket, users, user, structures);
  sendFavList(socket, users, user, io);
  sendRoomList(socket, users, user, io);

  var send_to_broadcast = {
    'uid': user._id,
    'name': user.name
  };

  socket.broadcast.emit('chat', JSON.stringify( {'action': 'user_connected', 'user': send_to_broadcast} ));
}

function catchMongodbErrorDisplay(err){
  if (err) {
    try { throw Error('Mongodb') } catch(err) { console.log(err); }
    return console.log(err);
  }
}

function createPreferences(user, emitChatCb){
    var newPref = new Preference({
      user: user._id
    });
    newPref.save(function(err){
        if(err){return catchMongodbErrorDisplay(err)};
      })
      .then(emitChatCb);
}

function sendDirectionLists(socket, users, user, structures){
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

function sendFavList(socket, users, user, io){
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
    io.to(users[socket.user_id]._id).emit('chat', JSON.stringify({'action': 'fav_list', 'data': favList}));
  });
}

function sendPreferences(socket, users, user, io){
  Preference.findOne({user: user._id}, function(err, pref){
    if (err) return console.log(err);

    var emitChatCb = function(){
      io.to(users[socket.user_id]._id).emit('chat', JSON.stringify({action: 'preferences', data: {
        sound: pref.sound,
        lang: pref.lang,
        notification: pref.notification,
        visibility: pref.visibility
      }}));
    };

    if(pref){
      emitChatCb();
    } else {
      createPreferences(user, emitChatCb);
    }
  });
}

function getCookieArray(cookieString){
  return cookie.parse(cookieString);
}

module.exports = {
  'createStructures': createStructures,
  'getDirection': getDirection,
  'getVisibility': getVisibility,
  'addUserToChat': addUserToChat,
  'sendRoomList': sendRoomList,
  'sendDirectionLists': sendDirectionLists,
  'sendPreferences': sendPreferences,
  'sendFavList': sendFavList,
  'getCookieArray': getCookieArray
}
