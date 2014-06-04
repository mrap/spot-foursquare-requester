'use strict'

var util = require('util')
  , mongoose = require('mongoose')
  , ObjectId = mongoose.Types.ObjectId;

module.exports.indexOfObjectId = function(arr, objectId){
  if (!util.isArray(arr) || !objectId) {
    console.error("arrayContainsObjectId requires a arr and objectId.");
    return false;
  }

  if (objectId instanceof ObjectId) objectId = objectId.toString();

  var i = arr.length;
  while(--i > -1){
    var obj = arr[i];
    if (obj == objectId || obj.id == objectId) return i;
  }
  return -1;
};
