/*
* Primary file of the Api
*
*/


//Dependencies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder

//relative imports
var config = require('./config');

//The server should respond to all requests with a string
var server = http.createServer(function(req,res){
    // Get the Url and parse it

    var parsedUrl = url.parse(req.url, true);

    //Get the path 

    var path = parsedUrl.pathname;
    var trimmedUrl = path.replace(/^\/+|\/+$/g, '');

    //Get the query string

    var queryString = JSON.stringify(parsedUrl.query);

    //Get the HTTP method

    var method = req.method.toLowerCase();

    //Get the headers of the request

    var headers = req.headers;

    //Get the stream

    var decoder = new StringDecoder('utf-8');
    var buffer = [];
    req.on('data',function(data){
      buffer.push(data);
    });
    req.on('end',function(){
      buffer = Buffer.concat(buffer).toString();
      //selected handler

      selectedHandler = typeof(router[trimmedUrl]) != 'undefined' ?router[trimmedUrl] :handlers.notFound;
      var data = {
        'trimmedUrl': trimmedUrl,
        'method': method,
        'queryString': queryString,
        'headers': headers,
        'payload': buffer,
      };

      selectedHandler(data, function(statusCode, payload){
       statusCode = typeof(statusCode) == 'number' ? statusCode : 200;
       payload = typeof(payload) == 'object' ? payload : {} ;

       //convert the payload to a string
       payloadString =JSON.stringify(payload);

       //return the response
       res.setHeader('Content-Type','application/json')
       res.writeHead(statusCode);
       res.end(payloadString);
       //log the request path

      console.log('the resp',statusCode,payloadString);
      });
    });
});

//Listen to a port
server.listen(config.port, function(){
  console.log('server started on port',config.port + 'in environment'+ config.envName);
});

//Define handlers

handlers = {};

//sample handler

handlers.sample = function(data, callback){
  callback(406, {'name': 'sample handler'});
};

handlers.notFound = function(data, callback){
  callback(404)
};
//set up routes

var router ={
  'sample': handlers.sample,
}