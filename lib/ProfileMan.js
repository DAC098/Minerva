const co = require('co');

const CryptKeeper = require('./CryptKeeper.js');

const logger = require('./log.js').logger('ProfileMan');

const ProfileMan = function ProfileMan(database) {

    const self = this;

    var profile = {};

    var logged_in = false;

    var db = database;

    this.create = co.wrap(function* (username,password) {
        var template = db.templates('profiles');
        var salt = CryptKeeper.getSalt();
        template.username = username;
        template.salt = salt;
        template.password = CryptKeeper.getHash(password,salt);
        template.ref = db.nextPk('profiles');
        var result = yield db.profiles.insert(template);
        if(result.result.ok) {
            logger(`profile created for ${username}`);
            return yield Promise.resolve(true);
        } else {
            logger(`unable to create profile for ${username}`);
            return yield Promise.resolve(false);
        }
    });

    this.login = co.wrap(function* (username,password) {
        var doc = yield db.profiles.find({username},{limit:1});
        if(doc[0]) {
            var check = CryptKeeper.getHash(password,doc[0].salt);
            if(check && check === doc[0].password) {
                profile = doc[0];
                try {
                    let connected = yield db.connectProfileDB(doc[0]);
                    let init = yield db.initProfileDB();
                    if(connected && init) {
                        logged_in = true;
                        logger(`${username} is logged in`);
                        return yield Promise.resolve(true);
                    } else {
                        logger(`unable to connect to profile db for ${username}`);
                    }
                } catch(err) {
                    logger('error when loading profile, error:',err.message);
                }
            } else {
                logger(`password is invalid for ${username}`);
            }
        } else {
            logger(`unable to find ${username}`);
        }
        return yield Promise.resolve(false);
    });

    this.update = co.wrap(function* (password,new_username,new_password) {
        var {username} = profile;
        var check = CryptKeeper.getHash(password,profile.salt);
        if(check === profile.password) {
            var new_hash = CryptKeeper.getHash(new_password,profile.salt);
            var result = db.profiles.update({username},{username: new_username,password: new_password,salt: new_salt});
            if(result.result.ok) {
                profile.username = new_username;
                profile.password = new_password;
                profile.salt = new_salt;
                logger(`${new_username} profile updated`);
                return yield Promise.resolve(true);
            } else {
                logger(`unable to update ${username}`);
            }
        } else {
            logger(`invalid password for ${username}`);
        }
        return yield Promise.resolve(false);
    });

    this.logout = co.wrap(function* () {
        try {
            let disconnected = yield db.disconnectProfileDB();
            if(disconnected) {
                profile = {};
                logged_in = false;
                logger('user has logged out');
                return yield Promise.resolve(true);
            } else {
                logger('unable to logout current user');
            }
        } catch(err) {
            logger('error when disconnecting profile, error:',err.message);
        }
        return yield Promise.resolve(false);
    });

    this.remove = co.wrap(function* (password) {
        var {username} = profile;
        var check = CryptKeeper.getHash(password,profile.salt);
        if(check === profile.password) {
            let dropped = yield db.dropProfileDB();
            if(dropped) {
                profile = {};
                logged_in = false;
                var result = db.profiles.remove({username});
                if(result.result.ok) {
                    logger(`user ${username} has been removed`);
                    return yield Promise.resolve(true);
                } else {
                    logger(`unable to remove ${username} from profiles collection`);
                }
            } else {
                logger(`unable to drop profile db for ${username}`);
            }
        } else {
            logger(`invalid password for ${username}`);
        }
        return yield Promise.resolve(false);
    });

    this.isLoggedIn = () => {
        return logged_in;
    }

}

module.exports = ProfileMan;
