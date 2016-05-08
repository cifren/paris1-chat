// Model Room

'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var RoomSchema = new mongoose.Schema({
  users: [{
    type: ObjectId,
    ref: 'User'
  }],
  messages: [{
    type: ObjectId,
    ref: 'Message'
  }],
  name: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('Room', RoomSchema);