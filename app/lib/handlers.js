
/*
*Request handlers
*/

//dependancies
var _data = require('./data');
var helpers = require('./helpers');
var config = require('./config');

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
handlers._users.get = function(data, callback){
  var phone = typeof(data.queryStringObject.phone)== 'string' && data.queryStringObject.phone.trim().length==10 ? data.queryStringObject.phone.trim():false;
  if(phone){
    //Get the token from the headers
     var token = typeof(data.headers.token)== 'string' ? data.headers.token :false;
    //verify the token is valid
    handlers._tokens.verify(token,phone,function(tokenIsValid){
     if(tokenIsValid){
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
       callback(403,'token is invalid');
     }
    });
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
handlers._users.put = function(data, callback){
  //Check for the required field
  var phone = typeof(data.payload.phone)== 'string' && data.payload.phone.trim().length==10 ? data.payload.phone.trim():false;
  //Check for optional fields
  var firstName = typeof(data.payload.firstName) === 'string' && data.payload.firstName.trim().length >0 ? data.payload.firstName.trim() : false;
  var lastName = typeof(data.payload.lastName) === 'string' && data.payload.lastName.trim().length >0 ? data.payload.lastName.trim() : false;
  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length >0 ? data.payload.password.trim() : false;
  
  if (phone){
    if (firstName || lastName || password){
       //Get the token from the headers
     var token = typeof(data.headers.token)== 'string' ? data.headers.token :false;
     //verify the token is valid
    handlers._tokens.verify(token,phone,function(tokenIsValid){
      if(tokenIsValid){
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
        callback(403,{'Error':'you are not authorized'});
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
//@TODO deleted related data
handlers._users.delete = function(data, callback){
  var phone = typeof(data.queryStringObject.phone)== 'string' && data.queryStringObject.phone.trim().length==10 ? data.queryStringObject.phone.trim():false;
  if(phone){
     //Get the token from the headers
     var token = typeof(data.headers.token)== 'string' ? data.headers.token :false;
     //verify the token is valid
    handlers._tokens.verify(token,phone,function(tokenIsValid){
      if(tokenIsValid){
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
        callback(403,{'Error':'Invalid token'})
      }
    });
  }else{
    callback(400, {'Error':'Missing required field'})
  }
  
};

// tokens handler
handlers.tokens = function(data, callback){
  var acceptableMethods = ['post','get','delete','put'];
  if (acceptableMethods.indexOf(data.method) > -1){
    handlers._tokens[data.method](data, callback);
  }else{
    callback(405);
  };
};
//container for all the tokens
handlers._tokens = {};

//tokens post
//Required data :- phone, password
//optional data : None
handlers._tokens.post = function(data, callback){
  var phone = typeof(data.payload.phone) === 'string' && data.payload.phone.trim().length ===10 ? data.payload.phone.trim() : false;
  var password = typeof(data.payload.password) === 'string' && data.payload.password.trim().length >0 ? data.payload.password.trim() : false;
  if(phone && password){
    //Lookup the user who matches that phone number
    _data.read('users',phone, function(err, userData){
       if(!err && userData){
         //Hash the password and compare it with the stored data
         hashedPassword = helpers.hash(password);
         if(hashedPassword == userData.hashedPassword){
           //If valid create new token with a random name .Set expiration date 1h in the future.
           var tokenId = helpers.createRandomString(20);
           var expires = Date.now() + 1000*60*60;
           var tokenObj = {
             'phone': phone,
             'id': tokenId,
             'expires': expires
           };
           //Store the token
           _data.create('tokens',tokenId,tokenObj, function(err){
              if(!err){
                callback(200,tokenObj);
              }else{
                callback(500, 'Could not create the token')
              }
           });
         }else{
           callback(400, {'Error': 'Wrong password'})
         }

       }else{
        callback(404,{'Error': 'user not found'})
       }
    });

  }else{
    callback(400, {'Error':'Missing required field(s)'})
  }
}

//tokens get
//Required data - ID
//optional data - none

handlers._tokens.get = function(data, callback){
  //
  var id = typeof(data.queryStringObject.id)== 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim():false;
  if(id){
    //look-up token
    _data.read('tokens',id, function(err,tokenData){
      if(!err && data){
        callback(200, tokenData);
      }else{
        callback(404);
      }
    })

  }else{
    callback(400,{'Error':'no such user'});
  }
}

//tokens put
//Required - id,extend
//optional data - none
handlers._tokens.put = function(data, callback){
  var id = typeof(data.payload.id) === 'string' && data.payload.id.trim().length==20 ? data.payload.id.trim() : false;
  var extend = typeof(data.payload.extend) === 'boolean' && data.payload.extend==true ? true : false;
  if(id && extend){
    //look up the tokens
    _data.read('tokens',id,function(err, tokenData){
      if(!err && tokenData){
        //check to make sure token is not expired
        if(tokenData.expires > Date.now()){
         //set the expiration an hour from now
         tokenData.expires =Date.now() + 1000 * 60 * 60;
         //store the new updates
         _data.update('tokens',id,tokenData, function(err){
           if(!err){
             callback(200);
           }else{
             callback(500, {'Error':'Internal server error'});
           }
         });
        }else{
          callback(401,{'Erro':'token has already expired'});
        }
      }else{
        callback(404,'no such user');
      }
    });
  }else{
    callback(400,{'Erro':'No such token or invalid fields'});
  }

}

//tokens delete
//Required data - id
//optional data -None
handlers._tokens.delete = function(data, callback){
  // check that an id is valid
  var id = typeof(data.queryStringObject.id)== 'string' && data.queryStringObject.id.trim().length==20 ? data.queryStringObject.id.trim():false;
  if(id){
    _data.read('tokens',id,function(err,tokenData){
      if(!err && tokenData){
        _data.delete('tokens',id, function(err){
           if(!err){
             callback(200);
           }else{
             callback(500, {'Error': 'Internal server error'})
           }
        });
      }else{
        callback(404, {'ERROR':'could not find the token'});
      }
    })

  }else{
    callback(400, {'Error':'Missing required field'})
  }
}

//Verify if a given token id is currently valid for a given user
handlers._tokens.verify = function(id,phone,callback){
  //look up the tokens
  _data.read('tokens',id, function(err,tokenData){
    if(!err && tokenData){
     //check that the token is for the given user and has not expired
     if(tokenData.phone == phone && tokenData.expires > Date.now()){
       callback(true);
     }else{
       callback(404,{'Error':'No such user'});
     }
    }else{
      callback(false)
    }
  });
}

// Checks handler
handlers.checks = function(data, callback){
  var acceptableMethods = ['post','get','delete','put'];
  if (acceptableMethods.indexOf(data.method) > -1){
    handlers._checks[data.method](data, callback);
  }else{
    callback(405);
  };
};

//Container for all the checks methods
handlers._checks = {};

//Checks post
//Required data- protocol,url,method,successCodes,timeOutSeconds
//optional data- none
handlers._checks.post = function(data, callback){
  var protocol = typeof(data.payload.protocol) === 'string' && ['https','http'].indexOf(data.payload.protocol)>-1 ? data.payload.protocol.trim() : false;
  var url = typeof(data.payload.url) === 'string' && data.payload.url.trim().length > 0 ? data.payload.url.trim() : false;
  var method = typeof(data.payload.method) === 'string' && ['get','delete','put','post'].indexOf(data.payload.method)>-1 ? data.payload.method.trim() : false;
  var successCodes = typeof(data.payload.successCodes) === 'object' && data.payload.successCodes instanceof Array && data.payload.successCodes.length>0 ? data.payload.successCodes : false;
  var timeOutSeconds = typeof(data.payload.timeOutSeconds) === 'number' && data.payload.timeOutSeconds%1==0 && data.payload.timeOutSeconds>=1 && data.payload.timeOutSeconds<=5 ? data.payload.timeOutSeconds : false;
  
  if(protocol,url,method,successCodes,timeOutSeconds){
    //Get the token from the headers
    var token = typeof(data.headers.token) == 'string'?data.headers.token : false;
    //Lookup  the user by reading the token
    _data.read('tokens',token, function(err,tokenData){
      if(!err && tokenData){
       var userPhone = tokenData.phone;
       //Lookup the user data 
       _data.read('users',userPhone, function(err, userData){
         if(!err && userData){
           var userChecks = typeof(userData.checks) == 'object' && userData.checks instanceof Array ? userData.checks: [];
           console.log(userChecks);
           //Verify that the user has less than the max checks per user
           if(userChecks.length < config.maxChecks){
            //Create random string for the id 
            var checkId = helpers.createRandomString(20);
            
            //Create the check object and include the users phone
            var checkObj={
              'id':checkId,
              'userPhone':userPhone,
              'protocol':protocol,
              'url':url,
              'method':method,
              'successCodes':successCodes,
              'timeOutSeconds':timeOutSeconds,
            }

            //Persist this object to disk
            _data.create('checks',checkId,checkObj, function(err){
              if(!err){
                //Add the check id to the users object
                userData.checks = userChecks;
                userData.checks.push(checkId);
                //save the new user data
                _data.update('users',userPhone,userData,function(err){
                  if(!err){
                    callback(200,checkObj)
                  }else{
                    callback(500,{'Error':'Internal server error'});
                  }
                });

              }else{
                callback(500,{'Error':'Could not create the check'});
              }
            });
           }else{
             callback(400,{'Error':'Max checks reached'});
           }
         }else{
           callback(403);
         }
       });
      }else{
        callback(403,{'Error':'Unknown token'})
      }
    });
  }else{
    callback(400,{'Error':'Missing required values'});
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