
/*
*Request handlers
*/

//dependancies
var _data = require('./data');
var helpers = require('./helpers');

// Define all the handlers
var handlers = {};

//users handler
handlers.users = function(data, callback){
  var acceptableMethods = ['post','get','delete','put'];
  if (acceptableMethods.indexOf(data.method) > -1){
    handlers._users[data.method](data, callback);
  }else{
    callback(405);
  };
};

//container for all the users submethods
handlers._users = {};

//users - get
handlers._users.get = function(data, callback){

};

//users - post
//Required data -firstName,lastName,phone,password,tosAgreement
//optional data - None
handlers._users.post = function(data, callback){
  // check all required fields are field out
  var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length >0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length >0 ? data.payload.lastName.trim() : false;
  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length ===10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length >0 ? data.payload.password.trim() : false;
  var tosAgreement= typeof(data.payload.tosAgreement) === 'boolean' && data.payload.tosAgreement === true ? true: false;
  if(firstName && lastName && phone && password && tosAgreement){
    //Make sure that the user doesnt already exist
    _data.read('users',phone,function(error,data){
      if(error){
        // hash the password
        var hashedPassword = helpers.hash(password);
        if(hashedPassword){
          //create the user object
        var userObject = {
          'firstName': firstName,
          'lastName' :lastName,
          'phone' :phone,
          'hashedPassword': hashedPassword,
          'tosAgreement': tosAgreement
        };
        
        //store the user
        _data.create('users',phone,userObject,function(err){
          if (!err){
            callback(200);
          }else{
            console.log(err);
            callback(500, 'could not create new user');
          }
          
        });

      }else{
        callback(500, {'error':'password failed to hash'});
      }
        }
        else{
        callback(400,{'error':'user exists'});
      }

    });

  }else{
    callback(400, {'Error':'missing required fields'});
  }
};

//users - put
handlers._users.put = function(data, callback){
  
};

//users - delete
handlers._users.delete = function(data, callback){
  
};

// ping handler
handlers.ping = function(data,callback){
    callback(200);
};

// Not found handler
handlers.notFound = function(data,callback){
  callback(404);
};

module.exports = handlers;