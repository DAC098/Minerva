const path = require('path');
const events = require('events');
const co = require('co');
const {BrowserWindow} = require('electron');
const {ipcMain} = require('electron');

const logger = require('./log.js').logger('LoginWin');

const LoginWin = function LoginWin(manager) {

    events.call(this);
    LoginWin.prototype.__proto__ = events.prototype;

    const self = this;

    var win = null;

    const resource_dir = path.join(process.cwd(),'resources');

    function dispatch(event,...args) {
        self.emit(event,...args);
    }

    function setListeners() {
        win.on('closed',() => dispatch('closed'));
    }

    function setIPC() {
        ipcMain.on('login',(event,username,password) => {
            co(function* () {
                let valid = yield manager.login(username,password);
                if(valid) {
                    dispatch('logged-in');
                } else {
                    event.sender.send('login-invalid');
                }
            });
        });

        ipcMain.on('create',(event,username,password) => {
            co(function* () {
                let result = yield manager.create(username,password);
                if(result) {
                    let valid = yield manager.login(username,password);
                    if(valid) {
                        dispatch('logged-in');
                    } else {
                        event.sender.send('login-invalid');
                    }
                } else {
                    event.sender.send('login-not-created');
                }
            });
        });
    }

    this.create = () => {
        win = new BrowserWindow({width:400,height:600,show:false});
        win.loadURL(`file://${resource_dir}/win.login.html`);
        setListeners();
    }

    this.show = () => {
        setIPC();
        win.show();
        win.webContents.openDevTools();
    }

    this.hide = () => {
        ipcMain.removeAllListeners();
        win.webContents.closeDevTools();
        win.hide();
    }

    this.close = () => {
        ipcMain.removeAllListeners();
        win.webContents.closeDevTools();
        win.close();
    }

}

module.exports = LoginWin;
