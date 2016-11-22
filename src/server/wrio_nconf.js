const path = require('path');
const fs =require('fs');
const nconf = require('nconf');

nconf.env().argv();

nconf.file(path.resolve(__dirname, '../../config.json'));

module.exports = nconf;