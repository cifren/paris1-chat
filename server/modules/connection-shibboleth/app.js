var shibboleth = {
  login: function(req, res, urlParts, config){
    if (!req.headers.cookie || req.headers.cookie.indexOf('_shibsession_') === -1){
        var idpId = "";
        if (urlParts.query.idpId){
          idpId = "providerId=" + urlParts.query.idpId;
        }
        var target = qs.escape("target=" + config.host + uri);
        var urlForceIdp = config.shib_login + "?" +  idpId + "&" + target;
        res.writeHead(302, {"Location": urlForceIdp});
        res.end();
        return;
      }
  }
}

module.exports = shibboleth;
