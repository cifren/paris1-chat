// Model user

'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var UserSchema = mongoose.Schema({
  user: {
    type: String,
    required: true,
    trim: true
  },
  displayName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'online'
  },
  service: {
    type: String,
    required: false,
    trim: true
  },
  preferences: {
    type: ObjectId,
    ref: 'Preference'
  },
  avatar: {
    type: String,
    required: false
  },
  rooms: [{
    type: ObjectId,
    ref: 'Room'
  }],
  favorites: [{
    type: ObjectId,
    ref: 'User'
  }]
});

UserSchema.method('toJSON', function() {
  return {
    user: this.user,
    displayName: this.displayName,
    preferences: this.preferences
  };
});

module.exports = mongoose.model('User', UserSchema);
