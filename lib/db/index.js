const DBMinerva = require('./index.js');

const settings = require('../../settings.js');

var url = ''

if(settings.local_connection) {
    url = `${settings.local.ip}:${settings.local.port}`;
} else {
    url = (settings.remote !== '') ? settings.remove : `${settings.local.ip}:${settings.local.port}`;
}

const db = new DBMinerva(url);

module.exports = db;
