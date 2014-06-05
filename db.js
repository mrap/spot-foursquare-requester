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

// "Clear cache"
var clearCache = function() {
  console.log('"Clearing cache"');
};

var clearCacheInterval = 600000; // 10 minutes
setInterval(function(){
  clearCache();
}, clearCacheInterval);

module.exports = mongoose;
