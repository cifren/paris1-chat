var LDAP = require('ldap-client'),
    model = require('../../manager.js');

var staffAffiliation = ["staff", "teacher", "researcher", "emeritus", "retired"],
    studentAffiliation = ["student", "alum"];

var user_ldap = function(config, structures){
  this.config = config;
  this.ldap = new LDAP({
      uri: config.ldap.uri,
      base: config.ldap.baseStr,
      scope: config.ldap.scope,
      filter: config.ldap.filter,
      attrs: config.ldap.attrsStr,
      connecttimeout: 5
  });

  var ldap = this.ldap;
  this.ldap.bind({
    binddn: config.ldap.binddn,
    password: config.ldap.password
    },
    function(err){
      if (err) return console.log(err);
      ldap.search({}, function(err, data){
        if (err) return console.log(err);
        model.createStructures(data, structures);
        // Update structures every hours
        setInterval(function(){
          ldap.search({}, function(err, data){
            if (err) return console.log(err);
            model.createStructures(data, structures);
          });
        }, 3600000);
      });
  });
};

user_ldap.prototype = {
  ldap: undefined,
  config: undefined,

  getAffiliationType: function (affiliation){
    var affiliationType = (staffAffiliation.indexOf(affiliation) >= 0) ? "staff" : null;
    if (!affiliationType) affiliationType = (studentAffiliation.indexOf(affiliation) >= 0) ? "student" : "guest";
    return affiliationType;
  },

  getLDAPAttributes: function (eppn, callback){
    /*if (eppn.indexOf("univ-paris1") === -1){
      return callback(null, {
        eduPersonPrimaryAffiliation: "guest",
        supannListeRouge: false
      });
    }*/
    this.ldap.search({base: this.config.ldap.basePeople,
      filter: "(eduPersonPrincipalName=" + eppn + ")",
      attrs: this.config.ldap.attrsPeople
    }, function(err, data){
      if (err) return console.log(err);
      var results = {
        eduPersonPrimaryAffiliation: data[0] && data[0].eduPersonPrimaryAffiliation[0],
        supannListeRouge: data[0] && (data[0].supannListeRouge[0] === "TRUE") ? true : false,
        modifyTimestamp: data[0] && data[0].modifyTimestamp[0]
      };
      return callback(err, results);
    });
  }

};


module.exports = user_ldap;
