'use strict'

var mongoose        = require('mongoose')
  , db              = mongoose.connection
  , FoursquarePhoto = require('./models/foursquare_photo')
  , FoursquareVenue = require('./models/foursquare_venue.js');

var uri = (process.env.NODE_ENV == 'production') ? process.env.MONGOHQ_URL : 'mongodb://localhost/spot_foursquare_requester';
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function(){
  console.log("Connected to MongoDB@%s", uri);
});

mongoose.connect(uri);

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

var INTERVAL_MIN = 120000  // 2 minutes
  , INTERVAL_MAX = 300000; // 5 minutes
// "Clear cache"
var clearCache = function() {
  console.log('"Clearing cache"');
  setTimeout(clearCache, getRandomInt(INTERVAL_MIN, INTERVAL_MAX));
};

module.exports = mongoose;
