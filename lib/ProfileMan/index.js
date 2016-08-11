const db = require('./db/index.js');
const CryptKeeper = require('./CryptKeeper.js');

const ProfileMan = function() {

    const self = this;

    var profile = {};

    var new_profile = false;

    function handleDB(type,data) {
        switch (type) {
            case 'insert':
                if(data.length === 1)
                    db.profiles.find({_id: data[0]});
                break;
            case 'find':
                if(data.length === 1)
                    _setProfile(data);
                break;
            case 'update':
                if(data === 1)
                    db.profiles.find({_id: profile._id});
            case 'remove':
                if(data === 1)
                    self.logout();
        }
    }

    db.on('profiles',handleDB);

    this.create = (username,password) => {
        var template = db.templates('profile');
        var salt = CryptKeeper.getSalt();
        template.username = username;
        template.salt = salt;
        template.password = CryptKeeper.getHash(password,salt);
        template.ref = 
        db.profiles.insert()
    }

}
