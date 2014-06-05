'use strict'

var http            = require('http')
  , url             = require('url')
  , querystring     = require("querystring")
  , util            = require('util')
  , db              = require('./db')
  , FoursquareVenue = db.model('FoursquareVenue');

var badRequest = function(req, res){
  res.statusCode = 400;
  res.end();
};

http.createServer(function(req, res) {
  var method = req.method.toLowerCase()
    , reqUrl = url.parse(req.url)
    , path   = reqUrl.pathname;

  // Ensure request is for GET /photo_ref
  if (method !== 'get' || path !== '/photo_ref') return badRequest(req, res);

  var query = querystring.parse(reqUrl.query)
    , venueIds = query.venue_ids;
  if (!venueIds) return res.end();

  // If only one id, venueIds will be a string
  if (typeof venueIds == 'string') 
    return FoursquareVenue.streamVenuePhotoUrls(venueIds, req, res);

  // else: venueIds will be an array of venue ids
  FoursquareVenue.fetchPhotoUrlsForVenues(venueIds, function(err, photoUrls){
    if (err) return res.end(err.toString());
    res.end(JSON.stringify(photoUrls));
  });
})
.listen(process.env.PORT || 5000);
