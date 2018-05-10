/*
* Create and export configuration variables
*/

//container for the environment
var environment = {};

//staging object (default)
environment.staging = {
  'httpPort': 3000,
  'httpsPort': 3001,
  'envName': 'staging'
};

// production object
environment.production = {
  'httpPort': 5000,
  'httpsPort': 5001,
  'envName' : 'production'
}

var currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV : '';

var envToExport = typeof(environment[currentEnv]) === 'object' ? environment[currentEnv]: environment.staging;

//export
module.exports = envToExport;