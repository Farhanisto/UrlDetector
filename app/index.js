/*
 * Primary file for API
 *
 */

 //Dependancies
 var server = require('./lib/server');
 var workers = require('./lib/workers');

 //Declare the app
 var app = {};

 //Initialize
 app.init = function(){
   //start the server 
   server.init();
   //start the workers
   workers.init();
 };

 //Execute the function
 app.init();

 //Export the app
 module.exports = app;