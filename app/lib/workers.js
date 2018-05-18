/*
 * This are worker related tasks
 * 
 */

 //Dependacies
 var path = require('path');
 var fs = require('fs');
 var _data = require('./data');
 var http = require('http');
 var https = require('https');
 var url = require('url'); 


 //instatiate the worker obj

 var workers = {}

 //look up all the checks , get the data and send it to a validotor
 workers.gatherAllChecks= function(){
  //get all the checks in the system
  _data.list('checks',function(err, checks){
   if(!err && checks && checks.length >0){
     checks.forEach(function(check) {
       //Read the check data
       _data.read('checks',check, function(err, originalCheckData){
         if(!err && originalCheckData){
            //Pass to the error validator
            workers.validateCheckData(originalCheckData);
         }else{
           console.log('Error reading a check');
         }

       });
     });
   }else{
     console.log('could not find any checks');
   }
  });
 };

 //sanity checking the check data
 workers.validateCheckData= function(originalCheckData){
  originalCheckData = typeof(originalCheckData) == 'object' && originalCheckData != null ?originalCheckData:false;
  originalCheckData.id = typeof(originalCheckData.id) == 'string' && originalCheckData.id.trim().length ==20 ? originalCheckData.id.trim() : false;
  originalCheckData.userPhone = typeof(originalCheckData.userPhone) == 'string' && originalCheckData.userPhone.trim().length ==10 ? originalCheckData.userPhone.trim() : false;
  originalCheckData.protocol = typeof(originalCheckData.protocol) == 'string' && ['http','https'].indexOf(originalCheckData.protocol) >-1? originalCheckData.protocol: false;
  originalCheckData.url = typeof(originalCheckData.url) == 'string' && originalCheckData.url.trim().length >0 ? originalCheckData.url.trim() : false;
  originalCheckData.method = typeof(originalCheckData.method) == 'string' && ['get','put','post','delete'].indexOf(originalCheckData.method) >-1? originalCheckData.method: false;
  originalCheckData.successCodes = typeof(originalCheckData.successCodes) == 'object' && originalCheckData.successCodes instanceof Array && originalCheckData.successCodes.length>0 ? originalCheckData.protocol: false;
  originalCheckData.timeOutSeconds = typeof(originalCheckData.timeOutSeconds) == 'number' && originalCheckData.timeOutSeconds %1 ===0 ? originalCheckData.timeOutSeconds: false;

  //set the keys which were not gonna be set if the workers have never seen this check before
  originalCheckData.state= typeof(originalCheckData.state) == 'string' && ['up','down'].indexOf(originalCheckData.protocol) >-1? originalCheckData.state: 'down';
  originalCheckData.lastChecked = typeof(originalCheckData.lastChecked) == 'number' && originalCheckData.lastChecked >0 ? originalCheckData.lastChecked: false;

  //If all the checks pass ,pass the data along to the next step in the process
  if(originalCheckData.id &&
     originalCheckData.userPhone &&
     originalCheckData.protocol &&
     originalCheckData.url &&
     originalCheckData.method &&
     originalCheckData.successCodes &&
     originalCheckData.timeOutSeconds){  
      workers.performCheck(originalCheckData);
  }else{
    console.log('Error getting the wrong data.');
  }  
 };

 //perform the check send the originalCheckData and outcome of performing the check
 workers.performCheck = function(originalCheckData){
  //Prepare the initial check outcome
  var checkOutCome ={
    'error':false,
    'responseCode': false
  };

  //Mark that the outcome has not been sent yet
  var outcomeSent = false;
  //parse the hostname and the path out of the original check data
  var parsedUrl = url.parse(originalCheckData.protocol+'://' + originalCheckData.url ,true);
  var hostName = parsedUrl.hostname;
  var path = parsedUrl.path;

  //Construct the request
  var requestDetails ={
    'protocol': originalCheckData.protocol +':',
    'hostname': hostName,
    'method': originalCheckData.method.toUpperCase(),
    'path': path,
    'timeout':originalCheckData.timeOutSeconds * 1000
  }

  //instatiate the request object using either http or https
  var _moduleToUse = originalCheckData.protocol == 'http' ? http:https ;

  //Craft the request
  var req = _moduleToUse.request(requestDetails, function(res){
    // Grab the status of the sent request
    var status = res.statusCode;

    //update the checkoutcome and pass the data along
    checkOutCome.responseCode = status;
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutCome);
      outcomeSent = true;
    }
  });

  //Bind to the error event so it doesnt get thrown
  req.on('error',function(err){
    //update the checkoutcome and pass the data along
    checkOutCome.error = {
      'error': true,
      'value':e
    };
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutCome);
      outcomeSent = true;
    }
  });
  //Bind to the timeout event so it doesnt get thrown
  req.on('timeout',function(err){
    //update the checkoutcome and pass the data along
    checkOutCome.error = {
      'error': true,
      'value':timeout
    };
    if(!outcomeSent){
      workers.processCheckOutcome(originalCheckData,checkOutCome);
      outcomeSent = true;
    }
  });

  //End the request
  req.end();
 };

 //process the check outcome,update the checkdata, trigger an alert to the user
 //special logic for a check that has never been tested before(dont alert on that one)
 
 workers.processCheckOutcome = function(originalCheckData,checkOutCome){
   //Decide if the check is up or down
   var state = !checkOutCome.error && checkOutCome.responseCode && originalCheckData.successCodes.indexOf(checkOutCome.responseCode)>1 ?'up':'down';
   //Decide if an alert is warranted
   var alertWarranted =originalCheckData.lastChecked && originalCheckData.state != state ? true:false;

   //update the checked data
   var newCheckedData = originalCheckData;
   newCheckedData.state =state;
   newCheckedData.lastChecked= Date.now();

   //save the updates to disk

   _data.update('check',newCheckedData.id,newCheckedData,function(err){
     if(!err){
       //Send the new check data to the next phase
       if(alertWarranted){
         workers.alerUserToStatusChange(newCheckedData);
       }else{
         console.log('No alert needed');
       }
     }else{
       console.log('Error trying to save the checks');
     }
   });
 }

 //alert the user on status change
 workers.alerUserToStatusChange = function(newCheckedData){
   var msg = 'Alert'+ newCheckedData.method.toUpperCase() +''+newCheckedData.protocol +'://'+newCheckedData.url +'is currently'+newCheckedData.state;
   helpers.sendTwilioSms(newCheckedData.userPhone,msg,function(err){
     if(!err){
      console.log('SUCCEESS'+msg);
     }else{
       console.log('FAILURE to aler user');
     }
   });
 };

 //Timer to execute the worker once per min
 workers.loop = function(){
   setInterval(function(){
    workers.gatherAllChecks();
   },1000*5);
 }
 //workers init script
 workers.init = function(){
   //execute all th checks immediately
   workers.gatherAllChecks()
   //call the loop so that the check excute on there own
   workers.loop();
 }

 //export 
 module.exports =workers