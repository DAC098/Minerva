const path = require('path');
const events = require('events');
const co = require('co');
const {BrowserWindow} = require('electron');
const {ipcMain} = require('electron');

const logger = require('./log.js').logger('MainWin');

const MainWin = function MainWin(manager,db) {

    events.call(this);
    MainWin.prototype.__proto__ = events.prototype;

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
        ipcMain.on('find-accounts',(event,query) => {
            co(function* () {
                var result = yield db.accounts.find(query);
                event.sender.send('find-accounts',result);
            });
        });

        ipcMain.on('find-emails',(event) => {
            co(function* () {
                var result = yield db.accounts.find({is_email: true});
                event.sender.send('find-emails',result);
            });
        });

        ipcMain.on('find-tags',(event) => {
            co(function* () {
                var result = yield db.accounts.dstinct('tags');
                event.sender.send('find-tags',result);
            });
        });
    }

    this.create = () => {
        win = new BrowserWindow({width:1280,height:720,show:false});
        win.loadURL(`file://${resource_dir}/win.main.html`);
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

    this.isDestroyed = () => win.isDestroyed();

}

module.exports = MainWin;
