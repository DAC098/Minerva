const fs = require('fs');
const path = require('path');

const settings = require('../settings.json');

var log_path = path.join(__dirname,'logs','mongod.log');
log_path = log_path.replace(/\\/g,'/');

var local_path = path.join(__dirname,'local');
local_path = local_path.replace(/\\/g,'/');

const config = `systemLog:
    verbosity: 3
    quiet: false
    destination: file
    path: "${log_path}"
    logRotate: rename
    timeStampFormat: iso8601-local
storage:
    dbPath: "${local_path}"
net:
    bindIp: ${settings.local.ip}
    port: ${settings.local.port}
    maxIncomingConnections: 5`

console.log(config);

fs.writeFile(path.join(__dirname,'bin','config','mongod.config'),config);
