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
    // update user
    this.updateUserFromLdap(event.user);
  });
  this._eventEmitter.on('user_manager_postload', (event) => {
    // update user
    this.updateUserFromLdap(event.user);
    // save information in database
    // user.save();
  });
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
