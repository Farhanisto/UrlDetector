/*
* Create and export configuration variables
*/

//container for the environment
var environment = {};

//staging object (default)
environment.staging = {
  'port': 3000,
  'envName': 'staging'
};

// production object
environment.production = {
  'port' : 5000,
  'envName' : 'production'
}

var currentEnv = typeof(process.env.NODE_ENV) === 'string' ? process.env.NODE_ENV : '';

var envToExport = typeof(environment[currentEnv]) === 'object' ? environment[currentEnv]: environment.staging;

//export
module.exports = envToExport;