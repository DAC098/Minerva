const electron = require('electron');
const co = require('co');
const events = require('events');

const mongodEXE = require('./lib/db/mongodEXE.js');
const DBMinerva = require('./lib/db/DBMinerva.js');
const ProfileMan = require('./lib/ProfileMan.js');
const LoginWin = require('./lib/LoginWin.js');
const logging = require('./lib/log.js');

const settings = require('./settings.json');

const {app} = electron;
const {BrowserWindow} = electron;

const logger = logging.logger('app');

const EE = new events.EventEmitter();

const mongod = new mongodEXE(settings);
const db = new DBMinerva();
const manager = new ProfileMan(db);
const login = new LoginWin(manager);
//const main = new MainWin(manager,db);

var ready = {
    db: false,
    app: false,
}

var quiting_app = false;

EE.on('ready',() => {
    logger('checking ready status')
    if(ready.db && ready.app) {
        logger('loading login window');
        login.show();
    }
});

mongod.on('ready',() => {
    logger('mongod is ready');
    co(function* () {
        var connected = yield db.connect(`${settings.local.ip}:${settings.local.port}`);
        var init = yield db.initMain();
        if(connected && init) {
            ready.db = true;
            EE.emit('ready');
        }
    });
});

mongod.on('error',() => {
    logger('error from mongod process');
});

mongod.on('closing',(status) => {
    if(quiting_app) {
        app.quit();
    }
});

mongod.on('killed',() => {
    if(quiting_app) {
        app.quit();
    }
});

login.on('logged-in',() => {
    logger('valid login, opening main window');
});

app.on('ready',() => {
    logger('app is ready');
    login.create();
    ready.app = true;
    EE.emit('ready');
});

app.on('will-quit',(event) => {
    quiting_app = true;
    if(mongod.isRunning()) {
        event.preventDefault();
        co(function* () {
            try {
                let result = yield db.sendAdminCmd({shutdown:1});
                if(result) {
                    yield db.disconnect();
                }
            } catch(err) {
                logger('error when quiting app');
            }
        });
    }
});

app.on('quit',() => {
    logger('app is quitting');
    logging.close();
});

mongod.makeConfig();
mongod.init();
mongod.start();
