const path = require('path');
const fs = require('fs');
const events = require('events').EventEmitter;
const eventEmitter = new events.EventEmitter();
const util = require('util');

const CryptKeeper = require('./CryptKeeper.js');

const cloneObj = (obj) => {
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

const ProfileMan = function ProfileMan() {
    events.call(this)
    ProfileMan.prototype.__proto__ = events.prototype;

    const self = this;

    const USERS_DIR = path.join(process.env.HOME,".minerva");

    const MAN_FILE = path.join(USERS_DIR,"man.json");

    const PRO_EXT = ".profile";

    const data_tmplt = {
        _groups: [],
    }

    var manager = {};

    var user_data = {};
    var user_data_changed = false;
    var user_data_saving = false;
    var user_profile_path = "";
    var user_key = "";
    var username = "";
    var user_password = "";

    const checkDir = () => {
        try {
            var status = fs.statSync(USERS_DIR);
        } catch(e) {
            if(e.code === "ENOENT") {
                console.log("making directory");
                fs.mkdir(USERS_DIR);
            }
        }
    }

    const setProfile = (profile_name,profile_password) => {
        username = profile_name;
        user_key = CryptKeeper.createKey(profile_name,profile_password);
        user_password = CryptKeeper.encryptPassword(profile_password,user_key);
        user_profile_path = path.join(USERS_DIR,profile_name+PRO_EXT);
    }

    this.loadManager = () => {
        checkDir();
        try {
            var status = fs.statSync(MAN_FILE);
            manager = require(MAN_FILE);
        } catch(e) {
            if(e.code === "ENOENT") {
                console.log("creating manager file");
                this.saveManger();
            }
        }
        self.emit('manager-loaded');
    }

    this.saveManger = () => {
        checkDir();
        manager_data = JSON.stringify(manager);
        fs.writeFile(MAN_FILE,manager_data,(err) => {
            if(err) {
                console.log(err);
            }
        });
    }

    this.createProfile = (profile_name,profile_password) => {
        // when ready, create encrypted data for file
        if(profile_name in manager) {
            console.log(`profile ${profile_name} already exists\nloading profile`);
            return this.loadProfile(profile_name,profile_password);
        } else {
            setProfile(profile_name,profile_password);
            user_data = cloneObj(data_tmplt);
            user_data_changed = true;
            manager[profile_name] = {password: user_password};
            this.saveManger();
            console.log(`profile ${profile_name} created`);
            return true;
        }
    }

    this.loadProfile = (profile_name,profile_password) => {
        if(profile_name in manager) {
            var t_key = CryptKeeper.createKey(profile_name,profile_password);
            if(manager[profile_name].password === CryptKeeper.encryptPassword(profile_password,t_key)) {
                setProfile(profile_name,profile_password);
                try {
                    var file_buffer = fs.readFileSync(user_profile_path);
                    user_data = CryptKeeper.decrptyProfile(file_buffer,user_key);
                    console.log(`current data:\n${util.inspect(user_data,{depth:null})}\n`);
                    return true;
                } catch(e) {
                    if(e.code === "ENOENT") {
                        console.log(`${profile_name} file does not exist, will create on save`);
                        user_data = cloneObj(data_tmplt);
                        user_data_changed = true;
                        console.log(`current data:\n${util.inspect(user_data,{depth:null})}\n`);
                        return true;
                    } else {
                        console.log(`error during load\n${e.stack}`);
                    }
                }
            } else {
                console.log("invalid password provided");
            }
        } else {
            console.log(`profile ${profile_name} does not exist`);
        }
        return false;
    }

    this.clearCurrentProfile = () => {
        console.log("clearing data from profile");
        user_data = {};
        user_data_saved = false;
        user_data_saving = false;
        user_key = "";
        username = "";
        user_password = "";
        console.log(`current data:\n${util.inspect(user_data,{depth:null})}\n`);
    }

    this.saveProfile = () => {
        if(user_data_changed && !user_data_saving) {
            const crypted_data = CryptKeeper.encryptProfile(user_data,user_key);
            user_data_saving = true;
            fs.writeFile(user_profile_path,crypted_data,(err) => {
                if(err) {
                    console.log(err);
                    user_data_saving = false;
                } else {
                    user_data_saving = user_data_changed = false;
                }
            });
        }
    }

    this.profileSaving = () => {
        return user_data_saving;
    }

    this.profileSaved = () => {
        return !user_data_changed;
    }

    this.addGroup = (group_name) => {
        console.log(`adding new group ${group_name}`);
        var temp = {
            g_name: group_name,
            count: 0,
            ref: []
        }
        const search_name = group_name.toLowerCase();
        if(user_data._groups.length === 0) {
            user_data._groups.unshift(temp);
            return;
        }
        if(count === user_data._groups.length - 1) {
            user_data._groups.push(temp);
            return;
        }
        var count = 0;
        for(const value of user_data._groups) {
            const value_name = value.g_name.toLowerCase();
            if(search_name > value_name) {
                user_data._groups.insert(temp,count);
                return;
            }
            ++count;
        }
    }

    this.removeGroup = (group_name) => {
        const search_name = group_name.toLowerCase();
        var count = 0;
        for(const value of user_data._groups) {
            const value_name = value.g_name.toLowerCase()
            if(search_name === value_name) {
                user_data._groups.remove(count);
            }
            ++count;
        }
    }

    this.getGroup = (group_name) => {
        var rtn = []
        if(group_name === "only-groups") {
            for(const value of user_data._groups) {
                rtn.push(value.g_name);
            }
            console.log(`sending groups: ${rtn}`);
            return rtn;
        } else {
            for(const value of user_data._groups) {
                if(group_name === value.g_name) {
                    for(const reference of value.ref) {
                        rtn.push(this.find(reference));
                    }
                    return rtn;
                }
            }
        }
    }

    this.addToGroup = (group_name,account_name) => {
        if(account_name in user_data) {
            for(const value of user_data._groups) {
                if(value.g_name === group_name) {
                    var count = 0;
                    for(const reference of value.ref) {
                        if(account_name > reference) {
                            user_data._groups.ref.insert(account_name,count);
                            return;
                        }
                        ++count;
                    }
                    user_data._groups.ref.push(account_name);
                }
            }
        }
    }

    this.removeFromGroup = (group_name,account_name) => {
        if(account_name in user_data) {
            for(const value of user_data._groups) {
                if(value.g_name === group_name) {
                    var count = 0;
                    for(const reference of value.ref) {
                        if(reference === account_name) {
                            user_data._groups.ref.remove(count);
                        }
                        ++count;
                    }
                }
            }
        }
    }

    this.addAccount = (account_name,account_data) => {
        var push_name = account_name.toLowerCase();
        user_data[push_name] = account_data;
        user_data_changed = false;
    }

    this.updateAccount = (account_name,account_data) => {
        if(account_name in user_data) {
            user_data[account_name] = account_data
            user_data_changed = false;
        }
    }

    this.deleteAccount = (account_name) => {
        if(account_name in user_data) {
            delete user_data[account_name];
            user_data_changed = false;
        }
    }

    this.findAccount = (account_name) => {
        if(account_name in user_data) {
            return user_data[account_name];
        }
        return {};
    }

    this.getAccounts = () => {
        var rtn = [];
        for(const key in user_data) {
            if(key !== "_groups") {
                rtn.push(user_data[key]);
            }
        }
        return rtn;
    }

}

module.exports = new ProfileMan()
