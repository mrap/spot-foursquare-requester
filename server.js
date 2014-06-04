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

  if (path !== '/photo_ref') return badRequest(req, res);

  if (method === 'get') {
    var query = querystring.parse(reqUrl.query)
      , venueIds = query.venue_ids;
    if (!venueIds) return res.end();
    
    if (typeof venueIds == 'string') return FoursquareVenue.streamVenuePhotoUrls(venueIds, req, res);

    FoursquareVenue.fetchPhotoUrlsForVenues(venueIds, function(err, photoUrls){
      if (err) return res.end(err.toString());
      res.end(JSON.stringify(photoUrls));
    });

  } else if (method === 'POST') {
    // res immedately
    // update the db
  }

}).listen(8888);

