//show an example of connection, for redirection
var connection = {
  // no login needed
  login: function(req, res, urlParts, config, uri){
    return;
  },
  end: false
};

module.exports = connection;
