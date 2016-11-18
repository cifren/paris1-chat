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
  name: {
    type: String,
    required: true
  },
  status: {
    type: String,
    required: true,
    default: 'online'
  },
  affectationPrincipale: {
    type: String,
    required: false
  },
  directions: [{
    type: String,
  }],
  favorites: [{
    type: ObjectId,
    ref: 'User'
  }],
  eduPersonPrimaryAffiliation: {
    type: String,
    required: false
  },
  affiliationType: {
    type: String,
    required: true,
  },
  supannListeRouge: {
    type: Boolean,
    required: false
  },
  modifyTimestamp: {
    type: String,
    required: false
  }
});

module.exports = mongoose.model('User', UserSchema);
