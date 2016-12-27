var _ = require('lodash');

var User = require('./models/user');

var user_manager = {
  _cookies: {},
  setCookies: function(cookies){
    this._cookies = cookies;
  },
  findUser: function(callback){
    var userIdCookie = this._loadUserFromCookie();
    var user = this._getUserFromDatabase(userIdCookie);

    user
      .then(function(user){
        if(!user){
          user_manager._createUser().then(callback);
        } else {
          callback(user)
        }
      });
  },
  _getUserFromDatabase: function(userId){
    return User.findOne({'_id': userId}).exec();
  },
  _createUser: function(cb){
    var uniqu = this._guid();
    var newUser = new User({
        "name": "Guest"+uniqu,
        "unlisted": false
    });
    return newUser
      .save(function(err, newUser) {
        if (err) return console.log(err);
      });
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
  }
}

module.exports = user_manager;
