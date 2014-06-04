'use strict'

var mongoose = require('mongoose')
  , Schema   = mongoose.Schema
  , FoursquarePhoto = mongoose.model('FoursquarePhoto')
  , request  = require('request')
  , async    = require('async')
  , dbHelper = require('../db_helper');

var schema = new mongoose.Schema({
  _id               : { type: String, unique: true, required: true, index: true },
  _photos           : [{ type: String, ref: 'FoursquarePhoto' }],
  last_refreshed_at : { type: Date, default: Date.now() }
}, {
  _id: false,
  autoIndex: false
});

var REFRESH_INTERVAL = 86400000; // ms in a day
schema.methods.needsRefresh = function(){
  return Date.now() - this.last_refreshed_at > REFRESH_INTERVAL;
};


var venuePhotosUrl = function(venueId){
  if (!venueId) return "";
  return "https://api.foursquare.com/v2/venues/"+venueId+"/photos";
};

// Configure foursquare request params
var CLIENT_ID     = process.env.FOURSQUARE_CLIENT_ID
  , CLIENT_SECRET = process.env.FOURSQUARE_CLIENT_SECRET
  , API_VERSION   = process.env.FOURSQUARE_API_VERSION || '20140226'
  , PHOTOS_LIMIT  = 4;
var requestParams = {
  client_id     : CLIENT_ID,
  client_secret : CLIENT_SECRET,
  v             : API_VERSION,
  limit         : PHOTOS_LIMIT
};

var getVenuePhotosRequestOptions = function(venueId){
  return {
    url : venuePhotosUrl(venueId),
    qs  : requestParams
  };
};

schema.statics.fetchPhotoUrlsForVenues = function(venueIds, done){
  var Venue = this
    , responseData = {}; // will return in done callback

  Venue.find({'_id': {$in: venueIds} }).populate('_photos').exec(function(err, venues){
    if (err) return done(err, null);

    // process all existing venues that do not require refreshing
    venues.forEach(function(venue){
      if (venue.needsRefresh) return;
      responseData[venue.id] = venue._photos; // add responseData
      var index = venueIds.indexOf(venue.id); // remove from venueIds array
      venueIds.splice(index, index+1);
    });

    // next: process all remaining venues
    async.each(venueIds, function(venueId, callback){
      var index = dbHelper.indexOfObjectId(venues, venueId)
        , venue = (index > -1) ? venues[index] : new Venue({_id: venueId}) ;

      request(getVenuePhotosRequestOptions(venueId), function(err, res, body){
        if (err || res.statusCode >= 400) return callback(err || res.statusCode);
        var data      = JSON.parse(body)
          , photoRefs = data.response.photos.items;

        responseData[venueId] = [];
        photoRefs.forEach(function(ref){
          ref.venueId = venue.id;
          var photo = FoursquarePhoto.newFromRef(ref);
          responseData[venueId].push(photo);
        });
        callback();
        venue._photos.addToSet(responseData[venueId]);
        venue.save(function(err){ if (err) console.error(err); });
      });
    }, function(err){
      done(err, responseData)
    });
  });
};

module.exports = mongoose.model('FoursquareVenue', schema);
