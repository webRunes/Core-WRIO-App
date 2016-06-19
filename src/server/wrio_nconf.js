import path from 'path';
import fs from 'fs';
import nconf from 'nconf';

nconf.env().argv();

nconf.file(path.resolve(__dirname, '../../config.json'));

export default nconf;
