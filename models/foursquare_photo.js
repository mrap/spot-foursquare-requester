'use strict'

var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var schema = new mongoose.Schema({
  _id        : { type: String, unique: true, required: true, index: true },
  _venue     : { type: String, ref: 'FoursquareVenue', required: true },
  prefix     : { type: String, required: true },
  suffix     : { type: String, required: true },
  created_at : { type: Date, default: Date.now }

}, {
  _id: false,
  autoIndex: false
});

schema.statics.newFromRef = function(ref){
  if (!ref || !ref.id || !ref.venueId) return null;
  var photo = new this({
    _id        : ref.id,
    _venue     : ref.venueId,
    prefix     : ref.prefix,
    suffix     : ref.suffix,
    created_at : ref.createdAt
  });
  return photo;
};

module.exports = mongoose.model('FoursquarePhoto', schema);
