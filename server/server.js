'cd tes use strict';

// Configuration
var http   = require('http'),
    request  = require('request'),
    fs       = require('fs'),
    path     = require('path'),
    url      = require('url'),
    socket = require('./socket.js'),
    database = require('./database.js'),
    default_connection = require('./connection.js'),
    default_user_manager = require('./user_manager.js')
    ;

// Load schema
var DefaultPreferenceModel = require('./model/preference'),
    DefaultMessageModel    = require('./model/message'),
    DefaultRoomModel       = require('./model/room');

var container = {
  database_manager: database,
  // might be overwritten
  "connection" : default_connection,
  // might be overwritten
  "user_manager": default_user_manager,
  //models
  "preference_model": DefaultPreferenceModel,
  "room_model": DefaultRoomModel,
  "message_model": DefaultMessageModel,
};

var server = {
  container: container,
  run: function(config){
    socket.container = container;
    socket.init();

    var connection = this.container.connection
    var port = process.env.PORT || config.port;
    // Launch server
    var httpServer = http.createServer(function(req, res){
      var urlParts = url.parse(req.url, true);

      var uri = urlParts.pathname;
      if (uri === "/login") uri = "/";
      var filename = path.join(__dirname, "../client/build/" + uri);

      // Add login logic if connection need it
      connection.login(req, res, urlParts, config, uri);
      // Terminate the request, if connection needs it
      if(connection.end){
        return ;
      }

      fs.stat(filename, function(err, stat) {
        if (err && err.code === "ENOENT") {
          res.writeHead(404, {"Content-Type": "text/plain"});
          res.write("404 Not Found\n");
          res.end();
          return;
        }
        else if (err){
          console.log(err);
          return;
        }

        if (fs.statSync(filename).isDirectory()){
          filename += '/index.html';
        }

        fs.readFile(filename, "binary", function(err, file) {
          if (err) {
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.write(err + "\n");
            res.end();
            return;
          }

          res.writeHead(200, {"Cache-Control": "max-age=0"});
          res.write(file, "binary");
          res.end();
        });
      });
    });
    socket.io.attach(httpServer);
    database.run(httpServer, port);
  }
};
//DEV
var config = require('./config'),
    shi_con = require('shibboleth_connection'),
    ldap_usr = require('ldap_user'),
    group = require('./module/group/app.js')
    ;
//server.container.connection = shi_con;
server.container.user_manager = ldap_usr;

server.run(config);
//DEV

module.exports = server;
