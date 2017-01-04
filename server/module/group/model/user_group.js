'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var UserGroupSchema = {
  user: {
      type: ObjectId,
      ref: 'User'
  },
  // group that the user is part of
  group: [{
    type: String
  }],
  // which group can see the user
  groupVisibilty: [{
    type: String
  }],
  // which group, the user wants to see on home
  groupShowHome: [{
    type: String
  }]
};

module.exports = UserGroupSchema;
