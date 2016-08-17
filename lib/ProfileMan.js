const co = require('co');

const CryptKeeper = require('./CryptKeeper.js');

const logging = require('./log.js');

const logger = logging.logger('ProfileMan');

const ProfileMan = function(database) {

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
                if(yield db.connectProfileDB(doc) && yield db.initProfileDB()) {
                    logged_in = true;
                    logger(`${username} is logged in`);
                    return yield Promise.resolve(true);
                } else {
                    logger(`unable to connect to profile db for ${username}`);
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
                logger(`${new_username} profile updated`);
                profile.username = new_username;
                profile.password = new_password;
                profile.salt = new_salt;
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
        if(yield db.disconnectProfileDB()) {
            profile = {};
            logged_in = false;
            logger('user has logged out');
            return yield Promise.resolve(true);
        } else {
            logger('unable to logout current user');
            return yield Promise.resolve(false);
        }
    });

    this.remove = co.wrap(function* (password) {
        var {username} = profile;
        var check = CryptKeeper.getHash(password,profile.salt);
        if(check === profile.password) {
            if(yield db.dropProfileDB()) {
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

module.export = ProfileMan;
