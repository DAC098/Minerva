const path = require('path');

const Logging = require('./Logging.js');

var logging = new Logging(path.join(process.cwd(),'logs'),{to_console:true,to_file:true});

module.exports = logging;
