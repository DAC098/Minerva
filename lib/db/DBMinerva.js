const events = require('events');
const util = require('util');
const assert = require('assert');

const MongoClient = require('mongodb').MongoClient;
const co = require('co');

const logger = require('../log.js').logger('db');
require('../ProtoExtend.js');

const DBMinerva = function(url) {

    events.call(this);
    DBMinerva.prototype.__proto__ = events.prototype;

    const self = this;

    // private variables

    var client = undefined;

    var url ='';

    var connections = {
        main: false,
        profile: false,
    }

    var initialized = {
        main: false,
        profile: false
    }

    var dbs = {
        main: undefined,
        profile: undefined
    };

    var collections = {
        accounts: undefined,
        profiles: undefined,
    }

    var pk = {
        profiles: 1,
        accounts: 1
    }

    const NO_CONNECTION = new Error('no-connection');
    const NOT_INITIALIZED = new Error('not-initialized');
    const CONNECTED = new Error('connected');

    // private methods

    function _setNextPK(value) {
        if(value in pk) {
            var next = pk[value].toString(16);
            ++pk[value];
        } else {
            logger(`unknown pk request: ${value}`);
        }
    }

    function _insert(name,collection,data,options = {}) {
        if(Array.isArray(data)) {
            data = data.map((element) => {
                element['_id'] = pk[name].toString(16);
                _setNextPK(name);
                return element;
            });
        } else {
            data['_id'] = pk[name].toString(16);
            _setNextPK(name);
        }
        return collection.insert(data,options);
    }

    function _update(name,collection,query = {},document = {},options = {}) {
        return collection.update(query,document,options);
    }

    function _remove(name,collection,query = {},options = {}) {
        return collection.remove(query,options);
    }

    function _find(name,collection,query = {},options = {}) {
        var cursor = collection.find(query);
        for(const key in options) {
            if(key in cursor) {
                cursor = cursor[key](options[key]);
            }
        }
        return cursor.toArray();
    }

    function _distinct(name,collection,field,query = {}) {
        return collection.distinct(field,query);
    }

    function _createIndex(name,collection,field,options = {}) {
        return collection.createIndex(field,options);
    }

    function _dropIndex(name,collection,index,options) {
        return collection.dropIndex(index,options);
    }

    function _indexExists(name,collection,index) {
        return collection.indexExists(index);
    }

    function _methods(name,collection) {
        return {
            insert: (...args) => _insert(name,collection,...args),
            update: (...args) => _update(name,collection,...args),
            remove: (...args) => _remove(name,collection,...args),
            find: (...args) => _find(name,collection,...args),
            distinct: (...args) => _distinct(name,collection,...args),
            createIndex: (...args) => _createIndex(name,collection,...args),
            dropIndex: (...args) => _dropIndex(name,collection,...args),
            indexExists: (...args) => _indexExists(name,collection,...args)
        }
    };

    this.connect = co.wrap(function* (url) {
        try {
            if(connections.main) {
                logger('a connection has already been established');
                return yield Promise.resolve(true);
            }
            dbs.main = yield MongoClient.connect(`mongodb://${url}/minerva`);
            collections.profiles = yield dbs.main.createCollection('profiles',{
                validator: {
                    '$and': [
                        {username: {'$type':'string'}},
                        {ref: {'$type':'string'}},
                        {salt: {'$type':'string'}},
                        {password: {'$type':'string'}}
                    ]
                }
            });
            self.profiles = _methods('profiles',collections.profiles);
            connections.main = true;
            logger(`main db connected to ${url}`);
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error during connection and setup, error:',err.message);
            return yield Promise.resolve(false);
        }
    });

    this.initMain = co.wrap(function* (){
        try {
            if(initialized.main || !connections.main) {
                if(!connections.main) {
                    logger('db cannot be initialized if there is not connection');
                    return yield Promise.reject(NO_CONNECTION);
                }
                if(initialized.main) {
                    logger('main db is already initialized');
                    return yield Promise.resolve(true);
                }
            }
            var check = yield collections.profiles.indexExists('username')
            if(!check) {
                yield collections.profiles.createIndex('username',{unique:true,background:true});
            }
            var doc = yield collections.profiles.findOne({},{limit:1,sort:[['_id',-1]],fields:{_id:1}});
            if(doc) {
                pk.profiles = parseInt(doc._id,16) + 1;
            }
            initialized.main = true;
            logger('initialization complete');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when initializing profiles collection, error:',err.message);
            return yield Promise.reject(err);
        }
    });

    this.sendAdminCmd = co.wrap(function* (command,options) {
        var result = {};
        let terminating = ('shutdown' in command);
        try {
            result = yield dbs.main.executeDbAdminCommand(command,options);
            return yield Promise.resolve(result);
        } catch(err) {
            if(terminating) {
                logger('terminating db');
                return yield Promise.resolve(true);
            }
            logger('error when execututing Admin command, error:',err);
            return yield Promise.reject(err);
        }
    });

    this.disconnect = co.wrap(function* () {
        try {
            if(!connections.main) {
                logger('no connection has been made for the main db');
                return yield Promise.reject(NO_CONNECTION);
            }
            yield dbs.main.close();
            connections.main = false;
            connections.profile = false;
            connections.profile = false;
            initialized.profile = false;
            logger('db has closed');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('an error has occured when closing db, error:',error.message);
            return yield Promise.reject(err);
        }
    });

    this.connectProfileDB = co.wrap(function* (doc) {
        try {
            if(!connections.main || connections.profile) {
                if(!connections.main) {
                    logger('the main connection has not been made');
                    return yield Promise.reject(NO_CONNECTION);
                }
                if(connections.profile) {
                    logger('a connection for a profile has already been made');
                    return yield Promise.resolve(true);
                }
            }
            dbs.profile = dbs.main.db(doc.ref);
            collections.accounts = yield dbs.profile.createCollection('accounts',{
                validator: {
                    '$and': [
                        {name: {'$type':'string'}},
                        {username:{'$type':'string'}},
                        {password:{'$type':'string'}},
                        {is_email:{'$type':'bool'}},
                        {email:{'$type':'string'}}
                    ],
                    '$or': [
                        {tags:{
                            '$type':'array',
                            '$elemMatch': {'$type':'string'}
                        }},
                        {fields:{
                            '$type':'array',
                            '$elemMatch': {
                                field: {'$type':'string'},
                                data: {'$type':'string'}
                            }
                        }}
                    ]
                }
            });
            self.accounts = _methods('accounts',collections.accounts);
            connections.profile = true;
            logger('profile db connected');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when connecting to profile db, error:',err.message);
            return yield Promise.reject(err);
        }
    });

    this.initProfileDB = co.wrap(function* () {
        try {
            if(!connections.main || !connections.profile || initialized.profile) {
                if(!connections.main) {
                    logger('no connection has been made for the main db');
                    return yield Promise.reject(NO_CONNECTION);
                }
                if(!connections.profile) {
                    logger('no connection has been made for the profile db');
                    return yield Promise.reject(NO_CONNECTION);
                }
                if(initialized.profile) {
                    logger('the profile db has already been initialized');
                    return yield Promise.resolve(true);
                }
            }
            var check = yield collections.accounts.indexExists('name');
            if(!check) {
                yield collections.accounts.createIndex('name',{unique:true,background:true});
            }
            var doc = collections.accounts.findOne({},{limit:1,sort:[['_id',-1]],field:{_id:1}});
            if(doc) {
                pk.accounts = parseInt(doc._id,16) + 1;
            }
            initialized.profile = true;
            logger('profile collections initialized');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when initializing accounts and groups collection, error:',err.message);
            return yield Promise.reject(err);
        }
    });

    this.dropProfileDB = co.wrap(function* () {
        try {
            if(!connections.main || !connections.profile) {
                if(!connections.main) {
                    logger('the main connection has not been made');
                }
                if(connections.profile) {
                    logger('a connection for a profile has not been made');
                }
                return yield Promise.reject(NO_CONNECTION);
            }
            yield dbs.profile.drop();
            connections.profile = false;
            initialized.profile = false;
            logger('profile db has been dropped');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when dropping profile db, error:',err.message);
            return yield Promise.reject(err);
        }
    });

    this.disconnectProfileDB = co.wrap(function* () {
        try {
            if(!connections.main || !connections.profile) {
                if(!connections.main) {
                    logger('the main connection has not been made');
                }
                if(!connections.profile) {
                    logger('a connection for a profile has not been made');
                }
                return yield Promise.reject(NO_CONNECTION);
            }
            yield dbs.profile.close();
            connections.profile = false;
            logger('profile db has closed');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when disconnecting profile db, error:',err.message);
            return yield Promise.reject(err);
        }
    });

    this.templates = (request) => {
        switch (request) {
            case 'accounts':
                return {
                    name: '',
                    username: '',
                    password: '',
                    is_email: false,
                    email: '',
                    tags: [],
                    fields: []
                };
                break;
            case 'profiles':
                return {
                    username: '',
                    ref: '',
                    salt: '',
                    password: ''
                };
                break;
            default:
                logger(`unknown template request ${request}`);
                return undefined;
        }
    }

    this.nextPk = (request) => {
        if(request in pk) {
            return pk[request].toString(16);
        } else {
            logger(`unknown pk request ${request}`);
            return undefined;
        }
    }

    this.connections = () => {
        return connections;
    }

    this.profiles = undefined;

    this.accounts = undefined;

    if(url && typeof url === 'string') {
        self.connect(url);
    }
}

module.exports = DBMinerva;
