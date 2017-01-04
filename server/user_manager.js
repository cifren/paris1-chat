var _ = require('lodash'),
    manager = require('./manager'),
    database_manager = require('./database'),
    json_user_model = require('./model/user'),
    message_model = require('./model/message')
    ;

var user_manager = {
  _cookies: {},
  user_model: undefined,
  json_user_model: undefined,
  init: function(socket){
    this._cookies = manager.getCookieArray(socket.handshake.headers.cookie);
  },
  findUser: function(callback){
    var userIdCookie = this._loadUserFromCookie();
    var user = this._getUserFromDatabase(userIdCookie);
    user
      .then(function(user){
        if(!user){
          user_manager._createUser().then(callback);
        } else {
          user = user_manager._refreshUserValue(user);
          callback(user)
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
  // refresh user on a load
  _refreshUserValue: function(user){
    return user;
  },
  _createUser: function(cb){
    var UserModel = this.getUserModel();
    var newUser = new UserModel(this._newUserValue());

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
    if(!this._cookies){
      console.log('Cookies are not set');
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
  }
}

module.exports = user_manager;
