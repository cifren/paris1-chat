var qs = require('querystring');

var connection = {
  login: function(req, res, urlParts, config, uri){
    // check the headers if shibboleth is connected
    if (!req.headers.cookie || req.headers.cookie.indexOf('_shibsession_') === -1){
      var idpId = "";
      if (urlParts.query.idpId){
        idpId = "providerId=" + urlParts.query.idpId;
      }
      // files requested
      var target = qs.escape("target=" + config.host + uri);
      var urlForceIdp = config.shib_login + "?" +  idpId + "&" + target;

      // redirect to shibboleth for login
      res.writeHead(302, {"Location": urlForceIdp});
      res.end();

      // terminate the request
      this.end = true;
      return;
    }
  },
  end: false
};

module.exports = connection;
