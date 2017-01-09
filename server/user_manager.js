var _ = require('lodash'),
    manager = require('./manager'),
    database_manager = require('./database'),
    json_user_model = require('./model/user'),
    message_model = require('./model/message')
    socketContainer = require('./socket'),
    myEmitter = socketContainer.eventEmitter;
    ;

var user_manager = {
  _cookies: undefined,
  _socketContainer: undefined,
  _eventEmitter: undefined,
  user_model: undefined,
  json_user_model: undefined,
  init: function(socketContainer){
    this._socketContainer = socketContainer;
    this._eventEmitter = this._socketContainer.eventEmitter;
  },
  findUser: function(callback){
    var userIdCookie = this._loadUserFromCookie();
    var user = this._getUserFromDatabase(userIdCookie);
    var _this = this;
    user
      .then(function(user){
        if(!user){
          user_manager._createUser()
            .then(callback)
            .then(function(user){_this._postCreate(user)});
        } else {
          _this._postLoad(user);
          callback(user);
        }
      }).catch(function(error) {
        console.log("Failed!", error);
      });
  },
  _getUserFromDatabase: function(userId){
    return this.getUserModel().findOne({'_id': userId}).exec()
              .catch(function(error) {
                console.log("Failed!", error);
              });
  },
  _createUser: function(cb){
    var UserModel = this.getUserModel();
    var newUser = new UserModel(this._newUserValue());
    this._preCreate(newUser);
    return newUser
      .save(function(err, newUser) {
        if (err) return console.log(err);
      });
  },
  _newUserValue : function(){
    var uniqu = this._guid();
    return {
        "name": "Guest"+uniqu,
        "unlisted": false
    };
  },
  _loadUserFromCookie: function(){
    console.log()
    if(!this._cookies){
      this._cookies = manager.getCookieArray(this._socketContainer.socket.handshake.headers.cookie);
      if(!this._cookies){
        console.log('Cookies are not set');
      }
    }
    return this._cookies.userId;
  },
  _guid: function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(5)
        .substring(1);
    }
    return s4();
  },
  _getJsonUserModel: function(){
    return this.json_user_model;
  },
  getUserModel: function(){
    if(!this.user_model){
      // compile model
      database_manager.compileModel('User', this._getJsonUserModel());
      this.user_model = database_manager.getModel('User');
    }
    return this.user_model;
  },
  _preCreate:function(user){
    this._eventEmitter.emit('user_manager_precreate', {user: user});
  },
  _postCreate:function(user){
    this._eventEmitter.emit('user_manager_postcreate', {user: user});
  },
  _postLoad:function(user){
    this._eventEmitter.emit('user_manager_postload', {user: user});
  },
  saveUser: function(user){
    return user.save(function(err, newUser) {
      if (err) return console.log(err);
    });
  }
}

// Activate init function when socketContainer is ready
myEmitter.on('plugin', (event) => {
  user_manager.init(event.socketContainer);
});

module.exports = user_manager;
