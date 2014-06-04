'use strict'

var mongoose = require('mongoose')
  , Schema   = mongoose.Schema;

var schema = new mongoose.Schema({
  _id        : { type: String, unique: true, required: true, index: true },
  venue_id   : { type: String, ref: 'FoursquareVenue', required: true },
  prefix     : { type: String, required: true },
  suffix     : { type: String, required: true },
  createdAt  : { type: Date, default: Date.now }

}, {
  _id: false,
  autoIndex: false,
  toJSON: {
    minimize: false,
    transform: function(doc, ret, options){
      delete ret._id;
      ret.id = doc.id;
    }
  }
});

schema.statics.newFromRef = function(ref){
  if (!ref || !ref.id || !ref.venueId) return null;
  var photo = new this({
    _id         : ref.id,
    venue_id   : ref.venueId,
    prefix     : ref.prefix,
    suffix     : ref.suffix,
    createdAt  : ref.createdAt
  });
  return photo;
};

module.exports = mongoose.model('FoursquarePhoto', schema);
