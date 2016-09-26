// Model preference

'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var PreferenceSchema = mongoose.Schema({
    user: {
        type: ObjectId,
        ref: 'User'
    },
    lang: {
        type: String,
        default: 'fr',
        required: false
    },
    sound: {
        type: Boolean,
        default: true,
        required: false
    },
    notification: {
        type: String,
        default: "denied",
        required: false
    }
});

module.exports = mongoose.model('Preference', PreferenceSchema);
