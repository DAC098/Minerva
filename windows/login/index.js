const events = require('events');
const {BrowserWindow} = require('electron');

const logging = require('../../lib/log.js');

const logger = logging.logger('LoginWin');

const LoginWin = function LoginWin(app,db) {

    events.call(this);
    LoginWin.prototype.__proto__ = events.prototype;

    const self = this;

    var win = null;

    function attachWindowEvents(win) {

    }

    function attachIPCEvents() {

    }

    this.createWindow = () => {
        logger('making LoginWin');

        win = new BrowserWindow({width:720,height:1280});


    }

}
