const path = require('path');
const fs = require('fs');
const events = require('events');
const eventEmitter = new events.EventEmitter();
const util = require('util');

const CryptKeeper = require('./CryptKeeper.js');

const event_names = {
    pro_saved: 'PROFILE-SAVED',
    pro_loaded: 'MANAGER-LOADED',
    pro_man_saved: 'MANAGER-SAVED',
}

const ProfileMan = function ProfileMan() {

    const self = this;

    events.EventEmitter.call(self);
    ProfileMan.prototype.__proto__ = events.EventEmitter.prototype;

    const USERS_DIR = path.join(process.env.HOME,".minerva");

    const MAN_FILE = path.join(USERS_DIR,"man.json");

    const PRO_EXT = ".profile";

    var manager = {};

    var user_data = {};

    var user_data_saved = false;

    var user_data_saving = false;

    var user_key = "";

    var username = "";

    var user_password = "";

    this.checkDir = () => {
        try {
            var status = fs.statSync(USERS_DIR);
        } catch(e) {
            if(e.code === "ENOENT") {
                console.log("making directory");
                fs.mkdir(USERS_DIR);
            }
        }
    }

    this.loadManager = () => {
        this.checkDir();
        try {
            var status = fs.statSync(MAN_FILE);
            manager = require(MAN_FILE);
        } catch(e) {
            if(e.code === "ENOENT") {
                console.log("creating manager file");
                this.saveManger();
            }
        }
        self.emit(event_names.pro_loaded);
    }

    this.saveManger = () => {
        this.checkDir();
        manager_data = JSON.stringify(manager);
        fs.writeFile(MAN_FILE,manager_data,(err) => {
            if(err) {
                console.log(err);
            }
            self.emit(event_names.pro_saved);
        });
    }

    this.createProfile = (profile_name,profile_password) => {
        // when ready, create encrypted data for file
        if(profile_name in manager) {

            console.log(`profile ${profile_name} already exists\nloading profile`);

            this.loadProfile(profile_name,profile_password);
        } else {
            user_key = CryptKeeper.createKey(profile_name,profile_password);
            username = profile_name;
            user_password = CryptKeeper.encryptPassword(profile_password,user_key);
            manager[profile_name] = {password: user_password};
            this.saveManger();
            console.log(`profile ${profile_name} created`);

        }
    }

    this.loadProfile = (profile_name,profile_password) => {
        if(profile_name in manager) {
            user_key = CryptKeeper.createKey(profile_name,profile_password);
            username = profile_name;
            user_password = CryptKeeper.encryptPassword(profile_password,user_key);
            if(manager[profile_name].password === user_password) {
                const profile_path = path.join(USERS_DIR,profile_name+PRO_EXT);
                try {
                    var status = fs.statSync(profile_path);
                    var file_buffer = fs.readFileSync(profile_path);
                    user_data = JSON.parse(CryptKeeper.decrptyProfile(file_buffer,user_key));
                } catch(e) {
                    console.log(`error during load\n${e.stack}`);
                    if(e.code === "ENOENT") {
                        console.log(`${profile_name} file does not exists, will create on save`);
                    }
                }
            } else {
                console.log("invalid password provided");
            }
        } else {
            console.log(`profile ${profile_name} does not exist`);
        }
    }

    this.saveProfile = () => {
        const crypted_data = CryptKeeper.encryptProfile(JSON.stringify(user_data),user_key);
        user_data_saving = true;
        fs.writeFile(profile_path,crypted_data,(err) => {
            if(err) {
                console.log(err);
            }
            user_data_saved = true;
            user_data_saving = false;
            self.emit(event_names.pro_saved);
        });
    }

    this.isSaving = () => {
        return user_data_saving;
    }

    this.isSaved = () => {
        return user_data_saved;
    }

    this.addAccount = (account_name,account_data) => {

        user_data_saved = false;
    }

    this.updateAccount = (account_name,account_data) => {

        user_data_saved = false;
    }

    this.deleteAccount = (account_name) => {

        user_data_saved = false;
    }

    this.findAccount = (account_name) => {

    }
}

module.exports = {
    'ProMan': ProfileMan,
    'events': event_names,
};
