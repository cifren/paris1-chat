var LDAP = require('ldap-client'),
    // TEMPORARY: need to create a better export for server.js
    default_um = require('../../server/user_manager'),
    json_user_model = require('./user_model');

// extends default user manager
var ldap_usr = default_um;

ldap_usr.init = function(socketContainer){
  this._socketContainer = socketContainer;
  this._eventEmitter = this._socketContainer.eventEmitter;
  ldap_usr.listeners();
};

ldap_usr.listeners = function(){
  this._eventEmitter.on('user_manager_precreate', (event) => {
    console.log('user_manager_precreate')
    // update user
    this.updateUserFromLdap(event.user);
  });
  this._eventEmitter.on('user_manager_postload', (event) => {
    console.log('user_manager_postload')
    var user = event.user;
    console.log(user)
    // update user
    this.updateUserFromLdap(event.user);
    console.log('before save')
    // save information in database
    this.saveUser();

    console.log('after save')
  });
};

ldap_usr.saveUser = function*(user){
  console.log('saveUser b')
    console.log('saveUser 1.0')
  try {
    console.log('saveUser 1')
    yield user.save(function(){
      console.log('saving')
    });
      console.log('saveUser 2')
  } catch(e) {
    error = e;
  }
  console.log('saveUser a')
};

ldap_usr.updateUserFromLdap = function(user) {
    // get ldap information
    // this._getLdapData();
    // update user
    // event.user = {}
};

// overwrite json user model
ldap_usr.json_user_model = json_user_model;

ldap_usr._newUserValue = function(){
  var uniqu = this._guid();
  return {
      "name": "Guest"+uniqu,
      "unlisted": false
  };
};

module.exports = ldap_usr;
