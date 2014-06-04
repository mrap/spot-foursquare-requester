'use strict'

var mongoose        = require('mongoose')
  , db              = mongoose.connection
  , FoursquarePhoto = require('./models/foursquare_photo')
  , FoursquareVenue = require('./models/foursquare_venue.js');

var uri  = 'mongodb://localhost/spot_foursquare_requester';
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Connected to MongoDB@%s", uri);
});

mongoose.connect(uri);

module.exports = mongoose;