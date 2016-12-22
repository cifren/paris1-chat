'use strict';

// Configuration
var config = require('./config');
var port = process.env.PORT || config.port;
var http   = require('http'),
    request  = require('request'),
    fs       = require('fs'),
    path     = require('path'),
    url      = require('url'),
    io = require('./socket.js'),
    database = require('./database.js'),
    shibboleth = require('./modules/connection-shibboleth/app.js')
    ;

// Launch server
var server = http.createServer(function(req, res){
  var urlParts = url.parse(req.url, true);

  var uri = urlParts.pathname;
  if (uri === "/login") uri = "/";
  var filename = path.join(__dirname, "../client/build/" + uri);
  shibboleth.login(req, res, urlParts, config);

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

io.attach(server);
database.run(server, port);
