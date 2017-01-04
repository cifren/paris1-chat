var //LDAP = require('ldap-client'),
    database_manager = require('../../server/database'),
    default_um = require('../../server/user_manager'),
    json_user_model = require('./user_model');

var ldap_usr = default_um;

// overwrite user model
ldap_usr.json_user_model = json_user_model;

ldap_usr._refreshUserValue = function(user){
  console.log('refreshvalue', user);
  return user;
};

ldap_usr._newUserValue = function(){
  var uniqu = this._guid();
  return {
      "name": "Guest"+uniqu,
      "unlisted": false
  };
};

module.exports = ldap_usr;
