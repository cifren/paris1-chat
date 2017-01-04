// Model user
var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

'use strict';
var jsonModel = {
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'online'
  },
  group: [{
      type: ObjectId,
      ref: 'Group'
  }],
  favorites: [{
    type: ObjectId,
    ref: 'User'
  }],
  unlisted: {
    type: Boolean,
    required: false
  },
  modifyTimestamp: {
    type: String,
    required: false
  }
};

module.exports = jsonModel;
