/*
* Create and export configuration variables
*/

//container for the environment
var environment = {};

//staging object (default)
environment.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging',
  'hashingSecret': 'thisisasecret',
  'maxChecks':5,
  'twilio' : {
    'accountSid' : 'ACe862bbed162662be0fa1b898afd7bcb6',
    'authToken' : '90d1424f5131d8009a932033ff327d4d',
    'fromPhone' : '+12035878474'
  }
};

// production object
environment.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName' : 'production',
  'hashingSecret': 'thisisalsoasecret',
  'maxChecks':5,
  'twilio' : {
    'accountSid' : 'ACe862bbed162662be0fa1b898afd7bcb6',
    'authToken' : '90d1424f5131d8009a932033ff327d4d',
    'fromPhone' : '+12035878474'
  }
}

var currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV : '';

var envToExport = typeof(environment[currentEnv]) === 'object' ? environment[currentEnv]: environment.staging;

//export
module.exports = envToExport;