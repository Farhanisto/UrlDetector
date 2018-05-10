/*
* Primary file of the Api
*
*/


//Dependencies
var http = require('http');
var https = require('https');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder
var fs = require('fs');

//relative imports
var config = require('./config');

//instatiating the http server
var httpServer = http.createServer(function(req,res){
    unifiedServer(req, res);
});

//Listen to a port
httpServer.listen(config.port, function(){
  console.log('server started on port',config.httpPort);
});

//instatiate the httpsServer
var httpsServer = http.createServer(function(req,res){
  unifiedServer(req, res);
});

var httpsServerOptions = {
  'key' : fs.readFileSync('./https/key.pem'),
  'cer' : fs.readFileSync('./https/cert.pem')
};

//Listen to a port
httpsServer.listen(config.port, function(){
  console.log('server started on port',config.httpsPort);
});

var httpsServer = https.createServer(httpsServerOptions,function(req,res){
  unifiedServer(req, res);
});

//all the logic for both http and https servers
var unifiedServer = function(req, res){
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
};

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