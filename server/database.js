var mongoose = require('mongoose');

var database = {
  models: {},
  run: function(server, port){
    mongoose.connect('mongodb://localhost/p1chat');
    var mongoDb = mongoose.connection;
    mongoDb.on('error', console.error.bind(console, 'Can\'t connect to MongoDB.'));
    mongoDb.on('open', function(){
      console.log('Connected to MongoDB, launch http server...');
      server.listen(port, function () {
        var addr = server.address();
        console.log('Server listening on ' + addr.address + addr.port);
      });
    });
  },
  compileModel: function(modelName, jsonModel){
    var modelSchema = mongoose.Schema(jsonModel);
    this.models[modelName] = mongoose.model(modelName, modelSchema);
  },
  getModel: function(name){
    return this.models[name];
  }
}

module.exports = database;
