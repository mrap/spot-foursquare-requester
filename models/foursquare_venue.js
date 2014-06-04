'use strict'

var mongoose        = require('mongoose')
  , Schema          = mongoose.Schema
  , FoursquarePhoto = mongoose.model('FoursquarePhoto')
  , request         = require('request')
  , async           = require('async')
  , dbHelper        = require('../db_helper')
  , JSONStream      = require('JSONStream')
  , Transform       = require('stream').Transform
  , _               = require('underscore');

var schema = new mongoose.Schema({
  _id               : { type: String, unique: true, required: true, index: true },
  photos            : [{ type: String, ref: 'FoursquarePhoto' }],
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

  Venue.find({'_id': {$in: venueIds} }).populate('photos').exec(function(err, venues){
    if (err) return done(err, null);

    // process all existing venues that do not require refreshing
    venues.forEach(function(venue){
      if (venue.needsRefresh) return;
      responseData[venue.id] = venue.photos; // add responseData
      var index = venueIds.indexOf(venue.id); // remove from venueIds array
      delete venueIds[index];
    });

    // next: process all remaining venues
    async.each(venueIds, function(venueId, callback){
      if (!venueId) return callback(); // already processed
      var index = dbHelper.indexOfObjectId(venues, venueId)
        , venue = (index > -1) ? venues[index] : new Venue({_id: venueId});

      request(getVenuePhotosRequestOptions(venueId), function(err, res, body){
        if (err || res.statusCode >= 400) return callback(err || res.statusCode);
        var data      = JSON.parse(body)
          , photoRefs = data.response.photos.items;

        responseData[venueId] = [];
        photoRefs.forEach(function(ref){
          ref.venueId = venue.id;
          var index = dbHelper.indexOfObjectId(venue.photos, ref.id)
            , photo = (index > -1) ? venue.photos[index] : FoursquarePhoto.newFromRef(ref);
          responseData[venueId].push(photo.toJSON());

          // Save only if a new photo
          if (index === -1) {
            venue.photos.push(photo);
            photo.save(function(err){ console.error(err); });
          }
        });

        // Callback now, then save to mongo in the bg
        callback();
        venue.save(function(err){ if (err) console.error(err); });
      });
    }, function(err){
      done(err, responseData)
    });
  });
};

schema.statics.streamVenuePhotoUrls = function(venueId, req, res){
  var Venue = this;
  Venue.findOne({_id: venueId}).populate('photos').exec(function(err, venue){
    if (err) console.error(err);

    if (venue && !venue.needsRefresh()) {
      return async.map(venue.photos,
                       function(photo, next){
                         next(null, photo.toJSON());
                       }, function(err, results){
                         res.end(JSON.stringify(results));
                       });
    }

    venue = new Venue({ _id: venueId });

    var stream       = JSONStream.parse('response..items')
      , transform    = new Transform({objectMode: true})
      , photoObjects = [];

    transform._transform = function(photoRefs, encoder, next){
      async.map(photoRefs,
                function(ref, next){
                  ref.venueId = venueId;
                  var photo = FoursquarePhoto.newFromRef(ref);
                  photoObjects.push(photo);
                  next(null, photo.toJSON());
                },
                function(err, results){
                  transform.push(JSON.stringify(results));
                  next();

                  // Save to update mongo
                  venue.last_refreshed_at = Date.now();
                  async.each(photoObjects, function(photo, cb){
                    if (dbHelper.indexOfObjectId(venue.photos, photo.id) > -1) return cb();
                    venue.photos.addToSet(photo.id);
                    cb();
                    // photo.save(function(err){ if (err) console.error(err); });
                  }, function(err){
                    // venue.save(function(err){ if (err) console.error(err); });
                  });
                });
    };

    request(getVenuePhotosRequestOptions(venueId))
      .pipe(stream)
      .pipe(transform)
      .pipe(res);
  });
};

module.exports = mongoose.model('FoursquareVenue', schema);
