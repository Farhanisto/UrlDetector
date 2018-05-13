/*
*This file is a helper for various tasks
*/

//Dependancies
var crypto = require('crypto');
var config = require('./config');

//container for all the helpers
var helpers = {};

//create a SHA256 has
helpers.hash = function(str){
  if(typeof(str)=='string' && str.length >0){
    var hash = crypto.createHmac('sha256',config.hashingSecret).update(str).digest('hex');
    return hash
  }else{
    return false;
  }
};

// parse a json object to an object in all cases with out throwing
helpers.parsedJsonToObject = function(str){
 try{
   var obj =JSON.parse(str);
   return obj;
 }catch(e){
   return {};
 }
};

//export the container
module.exports = helpers;