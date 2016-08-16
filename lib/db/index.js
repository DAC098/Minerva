const DBMinerva = require('./index.js');

const settings = require('../../settings.js');

const mongodEXE = require('./mongodEXE.js');

var url = ''

if(settings.local_connection) {
    mongodEXE.makeConfig();
    mongodEXE.init();
    mongodEXE.start();
    url = `${settings.local.ip}:${settings.local.port}`;
} else {
    url = (settings.remote !== '') ? settings.remote : `${settings.local.ip}:${settings.local.port}`;
}

const db = new DBMinerva(url);

module.exports = {
    db,
    mongodEXE
}
