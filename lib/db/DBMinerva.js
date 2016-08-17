const events = require('events');
const util = require('util');
const assert = require('assert');

const MongoClient = require('mongodb').MongoClient;
const co = require('co');

const logging = require('../log.js');
require('../ProtoExtend.js');

const DBMinerva = function(url) {

    events.call(this);
    DBMinerva.prototype.__proto__ = events.prototype;

    const self = this;

    // main connectors

    var client = undefined;

    var url ='';

    var connections = {
        main: false,
        profile: false,
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

    // private methods

    const logger = logging.logger('db');

    function _setNextPK(value) {
        if(value in pk) {
            var next = pk[value].toString(16);
            ++pk[value];
        } else {
            logger(`unknown pk request: ${value}`);
        }
    }

    function _insert(name,collection,data,options = {},promise = false) {
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

    function _update(name,collection,query = {},document = {},options = {},promise = false) {
        return collection.update(query,{'$set':document},options);
    }

    function _remove(name,collection,query = {},options = {},promise = false) {
        return collection.remove(query,options);
    }

    function _find(name,collection,query = {},options = {},promise = false) {
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
            indexExists: (...args) => _indexExists(name,collection,...args);
        }
    }

    this.connect = co.wrap(function* (url) {
        try {
            if(connections.main) {
                logger('a connection has already been established');
                return yield Promise.resolve(false);
            }
            dbs.main = yield MongoClient.connect(`mongodb://${url}/minerva`);
            collections.profiles = yield dbs.main.createCollection('profiles',{
                validation: {
                    '$and': [
                        {name: {'$type':'string'}},
                        {ref: {'$type':'string'}},
                        {salt: {'$type':'string'}},
                        {password: {'$type':'string'}}
                    ]
                }
            });
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
            if(!(yield collections.profiles.indexExists('name'))) {
                yield collections.profiles.createIndex('name',{unique:true,background:true});
            }
            var doc = yield collections.profiles.findOne({},{limit:1,sort:[['_id',-1]],fields:{_id:1}});
            if(doc) {
                pk.profiles = parseInt(doc._id,16);
            }
            logger('initialization complete');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when initializing profiles collection, error:',err.message);
            return yield Promise.resolve(false);
        }
    });

    this.disconnect = co.wrap(function* () {
        try {
            if(!connections.main) {
                logger('no connection has been made for the main db');
                return yield Promise.resolve(false);
            }
            yield dbs.main.close();
            connections.main = false;
            connections.profile = false;
            logger('db has closed');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('an error has occured when closing db, error:',error.message);
            return yield Promise.resolve(false);
        }
    });

    this.connectProfileDB = co.wrap(function* (doc) {
        try {
            if(!connections.main || connections.profile) {
                if(!connections.main) {
                    logger('the main connection has not been made');
                }
                if(connections.profile) {
                    logger('a connection for a profile has already been made');
                }
                return yield Promise.resolve(false);
            }
            dbs.profile = dbs.main.db(doc.ref);
            collections.accounts = yield dbs.profile.createCollection('accounts',{
                validation: {
                    '$and': [
                        {name: {'$type':'string'}},
                        {username:{'$type':'string'}},
                        {password:{'$type':'string'}},
                        {is_email:{'$type':'bool'}},
                        {email:{'$type':'string'}}
                    ],
                    '$or': [
                        {group:{
                            '$type':'array',
                            '$elemMatch': {'$type':'string'}
                        }},
                        {fields:{
                            '$type':'array',
                            '$elemMatch': {
                                field: {'$type':'string'},
                                data: {'$or':[
                                    {'$type':'string'},
                                    {'$type':'double'}
                                ]}
                            }
                        }}
                    ]
                }
            });
            connections.profile = true;
            logger('profile db connected');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when connecting to profile db, error:',err.message);
            retur yield Promise.resolve(false);
        }
    });

    this.initProfileDB = co.wrap(function* () {
        try {
            if(!(yield collections.accounts.indexExists('name'))) {
                yield collections.accounts.createIndex('name',{unique:true,background:true});
            }
            var doc = collections.accounts.findOne({},{limit:1,sort:[['_id',-1]],field:{_id:1}});
            if(doc) {
                pk.accounts = parseInt(acc_doc._id,16);
            }
            logger('profile collections initialized');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when initializing accounts and groups collection, error:',err.message);
            return yield Promise.resolve(false);
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
                return yield Promise.resolve(false);
            }
            yield dbs.profile.drop();
            connections.profile = false;
            logger('profile db has been dropped');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when dropping profile db, error:',err.message);
            return yield Promise.resolve(false);
        }
    });

    this.disconnectProfileDB = co.wrap(function* () {
        try {
            if(!connections.main || !connections.profile) {
                if(!connections.main) {
                    logger('the main connection has not been made');
                }
                if(connections.profile) {
                    logger('a connection for a profile has not been made');
                }
                return yield Promise.resolve(false);
            }
            yield dbs.profile.close();
            logger('profile db has closed');
            return yield Promise.resolve(true);
        } catch(err) {
            logger('error when disconnecting profile db, error:',err.message);
            return yield Promise.resolve(false);
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
                    group: '',
                    fields: []
                };
                break;
            case 'profiles':
                return {
                    name: '',
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

    this.profiles = _methods('profiles',collections.profiles);

    this.accounts = _methods('accounts',collections.accounts);

    if(url && typeof url === 'string') {
        self.connect(url);
    }
}

module.exports = DBMinerva;
