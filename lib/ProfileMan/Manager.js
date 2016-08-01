const path = require('path');
const fs = require('fs');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const CryptKeeper = require('../CryptKeeper.js');
const DataHandler = require('./DataHandler.js');

function cloneObj(obj) {
    var rtn = {};
    for(const key in obj) {
        if(typeof obj[key] === "object" && !Array.isArray(obj[key]) && (Object.keys(obj[key])).length !== 0) {
            rtn[key] = cloneObj(obj[key]);
        } else {
            var variable = obj[key];
            rtn[key] = variable;
        }
    }
    return rtn;
}

const Manager = function Manager(debug) {

    events.call(this);
    Manager.prototype.__proto__ = events.prototype;

    const self = this;

    const USERS_DIR = path.join(process.env.HOME,".minerva");
    const MANAGER_FILE = path.join(USERS_DIR,"manager.json");
    const PROFILE_EXT = '.profile';

    //const event_constants = require('./event_const.json');

    const profile_template = {
        logged_in: false,
        username: '',
        password: '',
        salt: '',
        path: '',
        status: {
            changed: false,
            saving: false,
        }
    };

    var manager_data = {};
    var profile = cloneObj(profile_template);

    const handler = new DataHandler(debug);

    handler.on('event',(...args) => {
        profile.status.changed = true;
        logger(`event dispatched from DataHandler`)
        dispatch(...args);
    });

    function logger(...args) {
        args.unshift('[Manager] ');
        if(debug) {
            console.log.apply(null,args);
        }
    }

    function checkDir() {
        try {
            var status = fs.statSync(USERS_DIR);
        } catch(e) {
            if(e.code === 'ENOENT') {
                logger('users directory not found, making directory');
                fs.mkdir(USERS_DIR);
            }
        }
    }

    const setProfileData = (name,password,new_user) => {
        profile.logged_in = true;
        profile.username = name;
        profile.salt = (new_user) ? CryptKeeper.getSalt() : manager_data[name].salt;
        profile.password = CryptKeeper.getHash(password,profile.salt);
        profile.status.changed = new_user;
        profile.path = path.join(USERS_DIR,name+PROFILE_EXT);

        if(new_user) {
            manager_data[name] = {salt: profile.salt,password: profile.password};
            handler.initPKs();
        }
    }

    const profileExists = (name) => {
        for(const key in manager_data) {
            if(key === name) {
                return true;
            }
        }

        return false;
    }

    const checkPassword = (name,password) => {
        if(profileExists(name)) {
            var salt = manager_data[name].salt;
            var hash = CryptKeeper.getHash(password,salt);

            return manager_data[name].password === hash;
        }

        return false;
    }

    const dispatch = (ref,type,data) => {
        logger(`event dispatched for: ${ref},
    type: ${type},
    result: ${data}`);
        self.emit('event',ref,type,data);
    }

    this.load = () => {
        checkDir();
        try {
            var status = fs.statSync(MANAGER_FILE);
            var tmp_data = fs.readFileSync(MANAGER_FILE,{encoding: 'utf-8'});
            manager_data = JSON.parse(tmp_data);
            dispatch('manager','loaded');
            return true;
        } catch(e) {
            if(e.code === 'ENOENT') {
                logger('making manager file');
                dispatch('manager','loaded');
                return true;
            } else {
                logger('error when loading manager file:',e.message);
                return true;
            }
        }
    }

    this.save = () => {
        checkDir();

        var tmp_data = JSON.stringify(manager_data);
        fs.writeFile(MANAGER_FILE,tmp_data,(err) => {
            if(err) {
                logger('error when writing manager file:',err.message);
            } else {
                logger('manager file saved');
                dispatch('manager','saved');
            }
        });
    }

    this.users = () => {
        var rtn = [];
        for(const key in manager_data) {
            rtn.push(key);
        }
        return rtn;
    }

    this.profile = {
        create: (name,password) => {
            if(profileExists(name)) {
                logger(`profile: ${name} already exists, loading profile`);
                return self.profile.load(name,password);
            } else {
                setProfileData(name,password,true);
                logger(`profile: ${name} created`);
                return true;
            }
        },
        find: (name) => {
            var result = profileExists(name);
            logger(`profile: ${name}`,(result) ? 'found' : 'not found');
            return result;
        },
        load: (name,password) => {
            if(typeof name !== 'string' || typeof password !== 'string') {
                logger(`arguments passed must be of type string, load failed`);
                return false;
            }
            if(profile.logged_in && checkPassword(name,password)) {
                logger(`profile: ${name} is already logged in`);
                return true;
            }
            if(profileExists(name)) {
                if(checkPassword(name,password)) {
                    setProfileData(name,password);
                    try{
                        var buffer = fs.readFileSync(profile.path);
                        handler.data.set(CryptKeeper.decrptyProfile(buffer,profile.password));
                        return true;
                    } catch(err) {
                        if(err.code === 'ENOENT') {
                            logger(`profile: ${name} file does not exists, no data to load`);
                            handler.initPKs();
                            profile.status.changed = true;
                            return true;
                        } else {
                            logger(`error when loading profile data:`,err.message);
                            return false;
                        }
                    }
                } else {
                    logger(`password provided is invalid for profile: ${name}, load failed`);
                    return false;
                }
            } else {
                logger(`profile: ${name} not found, load failed`);
                return false;
            }
        },
        save: () => {
            if(profile.status.changed && !profile.status.saving) {
                logger(`saving profile: ${profile.username}`);
                const crypted_data = CryptKeeper.encryptProfile(handler.data.get(),profile.password);
                profile.status.saving = true;
                fs.writeFile(profile.path,crypted_data,(err) => {
                    if(err) {
                        logger(`error when saving profile: ${profile.username}`,e.message);
                        profile.status.saving = false;
                    } else {
                        logger(`profile: ${profile.username} saved`);
                        profile.status.saving = profile.status.changed = false;
                        dispatch('profile','saved');
                    }
                });
            }
        },
        hasChanged: () => {
            return profile.status.changed;
        },
        clear: () => {
            profile = cloneObj(profile_template);
            handler.data.clear();
            return true;
        }
    }

    this.group = handler.group;

    this.account = handler.account;

    this.email = handler.email;

    this.groupCall = (method_call,...args) => {
        if(method_call in handler.group) {
            var result = handler.group[method_call].apply(null,args);
            return result;
        } else {
            logger(`unknown method: ${method_call}, cancelling operation for group`);
            return undefined;
        }
    }

    this.accountCall = (method_call,...args) => {
        if(method_call in handler.account) {
            var result = handler.account[method_call].apply(null,args);
            return result;
        } else {
            logger(`unknown method: ${method_call}, cancelling operation for account`);
            return undefined;
        }
    }

    this.emailCall = (method_call,...args) => {
        if(method_call in handler.email) {
            var result = handler.email[method_call].apply(null,args);
            return result;
        } else {
            logger(`unknown method: ${method_call}, cancelling operation for email`);
            return undefined;
        }
    }
}

module.exports = Manager;
