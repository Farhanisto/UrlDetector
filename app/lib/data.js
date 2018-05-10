/*
*Libary for storing and editing data
*/

var fs = require('fs');
var path = require('path');

//Container for the module to be exported
var lib = {};

//base dir of the lib folder
lib.baseDir = path.join(__dirname,'../.data/');
//write data to a file
lib.create = function(dir,file,data,callback){
  //open a file
  fs.open(lib.baseDir+dir+'/'+file+'.json','wx', function(err, fileDescriptor){
    if (!err && fileDescriptor){
     // convert data into string
     var stringData = JSON.stringify(data);
     fs.write(fileDescriptor,stringData,function(err){
       if(!err){
         fs.close(fileDescriptor,function(err){
           if(!err){
             callback(false);
           }else{
             callback('error closing new file');
           }
         })
       }else{
         callback('error writing to new file');
       }
     });
    }else{
      callback('could not create this file, it may already exist');
    }

  });

};

//Read data from a file
lib.read = function(dir, file, callback){
   fs.readFile(lib.baseDir+ dir +'/'+file+ '.json','utf-8',function(err, data){
     callback(err,data);
   });
}

//Update existing file
lib.update = function(dir,file,data,callback){
  //open the file for writing
  fs.open(lib.baseDir+dir+'/'+file+'.json','r+', function(err,fileDescriptor){
     if(!err && fileDescriptor){
      var stringData = JSON.stringify(data);
      //Truncate the content of the file
      fs.truncate(fileDescriptor,function(err){
        if(!err){
          //Write to the file and close
          fs.writeFile(fileDescriptor, stringData, function(err){
            if (!err){
              fs.close(fileDescriptor, function(err){
                if(!err){
                  callback(false);
                }else{
                  callback('failed to close the file');
                }
              });
            }else{
              callback('error writing to the file');
            }
          });
        }else{
          callback('failed to trucate content on the file')
        }
      })
     }else{
       callback('Could not open the file, it may not exist yet');
     }
  });
}

//Delete a file
lib.delete = function(dir,file,callback){
  //unlinking the file
  fs.unlink(lib.baseDir +dir+'/'+file+'.json',function(err){
    if(!err){
      callback(false);
    }else{
      callback('error deleting the file');
    }
  })
}
//export
module.exports = lib;