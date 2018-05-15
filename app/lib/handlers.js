
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
//required data - phone
//optional data - none
// @TODO only let the authenticated users access this and access there data
handlers._users.get = function(data, callback){
  var phone = typeof(data.queryStringObject.phone)== 'string' && data.queryStringObject.phone.trim().length==10 ? data.queryStringObject.phone.trim():false;
  if(phone){
    //look-up user
    _data.read('users',phone, function(err,data){
      if(!err && data){
        // remove the hashed password
        delete data.hashedPassword;
        callback(200, data);
      }else{
        callback(404);
      }
    })

  }else{
    callback(400,{'Error':'no such user'});
  }
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
//Required data - phone
//optional data -firstName, lastName, password (at least one must be provided)
//@TODO only let authenticated users update there information ONLY
handlers._users.put = function(data, callback){
  //Check for the required field
  var phone = typeof(data.payload.phone)== 'string' && data.payload.phone.trim().length==10 ? data.payload.phone.trim():false;
  //Check for optional fields
  var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length >0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length >0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length >0 ? data.payload.password.trim() : false;
  
  if (phone){
    if (firstName || lastName || password){
      //lookup users
      _data.read('users',phone, function(err, userData){
        if(!err && userData){
          if(firstName){
            userData.firstName = firstName;
          }
          if(lastName){
            userData.lastName = lastName;
          }
          if(password){
            userData.hashedPassword = helpers.hash(password);
          }
          //store the updates on disk
          _data.update('users', phone,userData, function(err){
            if (!err){
              callback(200);
            }else{
              console.log(err);
              callback(500, {'error ': 'Internal server error'});
            }
          })
        }else{
          callback(400, {'Error': 'specified user does not exist'});
        }

      });
 
    }else{
      callback(400,{'error':'Missing fields to update'});
    }

  }else{
    callback(400,{'Error': 'Missing required fields'});
  }
}

//users - delete
//required field - phone
//@TODO only let an authenticated user delete there data
//@TODO deleted related data
handlers._users.delete = function(data, callback){
  var phone = typeof(data.queryStringObject.phone)== 'string' && data.queryStringObject.phone.trim().length==10 ? data.queryStringObject.phone.trim():false;
  if(phone){
    _data.read('users',phone,function(err,userData){
      if(!err && userData){
        _data.delete('users',phone, function(err){
           if(!err){
             callback(200);
           }else{
             callback(500, {'Error': 'Internal server error'})
           }
        });
      }else{
        callback(404, {'ERROR':'could not find the user'});
      }
    })

  }else{
    callback(400, {'Error':'Missing required field'})
  }
  
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