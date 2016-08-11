const events = require('events');
const util = require('util');
const assert = require('assert');

const MongoClient = require('mongodb').MongoClient;
const co = require('co');

const logging = require('../log.js');
require('../ProtoExtend.js');

const DBMinerva = function(url,options) {

    events.call(this);
    DBMinerva.prototype.__proto__ = events.prototype;

    const self = this;

    // main connectors

    var connected = false;

    var client = undefined;

    var db = undefined;

    var profiles = undefined;

    // profile dependent variables

    var profile_connected = false;

    var profile_db = undefined;

    var groups = undefined;

    var accounts = undefined;

    // pk variables

    var pk = {
        profiles: 1,
        groups: 1,
        accounts: 1
    }

    // private methods

    const logger = logging.logger('db');

    function _dispatch(event,type,data) {
        self.emit(event,type,data);
    }

    function _setNextPK(value) {
        if(value in pk) {
            var next = pk[value].toString(16);
            ++pk[value];
        } else {
            logger(`unknown pk request: ${value}`);
        }
    }

    function _insert(name,collection,data,options = {}) {
        if(data && (Array.isArray(data) || typeof data === 'object')) {
            co(function* () {
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
                var result = yield collection.insert(data,options);
                if(result.result.ok) {
                    logger(`${result.insertedCount} documents inserted into ${name}`);
                    _dispatch(name,'inserted',result.insertedIds);
                } else {
                    logger(`insert for ${name} did not execute properly`);
                    _dispatch(name,'inserted',[]);
                }
            }).catch((error) => {
                logger(`error during method insert for ${name}, error:`,error.message);
                _dispatch(name,'error',error);
            });
        } else {
            logger('data must be either an object or an array');
            _dispatch(name,'inserted',[]);
        }
    }

    function _update(name,collection,query = {},document = {},options = {}) {
        co(function* (){
            var result = yield collection.update(query,{'$set':document},options);
            if(result.result.ok) {
                logger(`${result.result.nModified} documents updated for ${name}`);
                _dispatch(name,'updated',result.result.nModified)
            } else {
                logger(`update for ${name} did not execute properly`);
                _dispatch(name,'updated',-1);
            }
        }).catch((error) => {
            logger(`error during method update for ${name}, error:`,error.message);
            _dispatch(name,'error',error);
        });
    }

    function _remove(name,collection,query = {},options = {}) {
        co(function* () {
            var result = yield collection.remove(query,options);
            if(result.result.ok) {
                logger(`${result.result.n} documents removed from ${name}`);
                _dispatch(name,'removed',result.result.n);
            } else {
                logger(`remove for ${name} did not execute properly`);
                _dispatch(name,'removed',-1);
            }
        }).catch((error) => {
            logger(`error during method remove for ${name}, error:`,error.message);
            _dispatch(name,'error',error);
        });
    }

    function _find(name,collection,query = {},options = {}) {
        co(function* () {
            var cursor = collection.find(query);
            if(options.sort) {
                cursor = cursor.sort(options.sort);
            }
            if(options.project) {
                cursor = cursor.project(options.project);
            }
            var result = yield cursor.toArray();
            logger(`${result.length()} documents found in ${name} from query:`,query);
            _dispatch(name,'found',result);
        }).catch((error) => {
            logger(`error during method find for ${name},error:`,error.message);
            _dispatch(name,'error',error);
        });
    }

    function _methods(name,collection) {
        return {
            insert: (data,options) => _insert(name,collection,query,document),
            update: (query = {},document = {},options = {}) => _update(name,collection,query,document,options),
            remove: (query = {},options = {}) => _remove(name,collection,query,options),
            find: (query = {},options = {}) => _find(name,collection,query,options);
        }
    }

    this.connect = (url) => {
        co(function* () {
            db = yield MongoClient.connect(`mongodb://${url}/minerva`);
            profiles = yield db.createCollection('profiles',{
                validation: {
                    '$and': [
                        {name: {'$type':'string'}},
                        {ref: {'$type':'string'}},
                        {salt: {'$type':'string'}},
                        {password: {'$type':'string'}}
                    ]
                }
            });
            yield profiles.createIndex('name_index',{name: 1},{unique:true,background:true});
            var doc = yield profiles.findOne({},{limit:1,sort:[['_id',-1]],fields:{_id:1}});
            if(doc) {
                pk.profiles = parseInt(doc._id,16);
            }
            logger(`db connected to ${url}, setup complete`);
            _dispatch('db','connected');
        }).catch((error) => {
            logger('error during connection and setup, error:',error.message);
            _dispatch('db','error',error);
        });
    }

    this.disconnect = () => {
        co(function* () {
            yield db.close();
            logger('db has closed');
            _dispatch('db','closed');
        }).catch((error) => {
            logger('an error has occured when closing db, error:',error.message);
            _dispatch('db','error',error);
        });
    }

    this.connectProfile = (username) => {
        co(function* () {
            var doc = yield profiles.findOne({username},{limit:1,fields:{ref:1}});
            if(!doc) {
                profile_connected = false;
                logger('unable find profile, profile not connected');
                _dispatch('db','profile-connected',false);
                return;
            }
            profile_db = db.db(doc.ref);
            accounts = yield profile_db.createCollection('accounts',{
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
                            _id:{'$type':'objectId'},
                            name:{'$type':'string'}
                        }},
                        {fields:{'$type':'array'}}
                    ]
                }
            });
            yield accounts.createIndex('name_index',{unique:true,background:true});
            groups = yield profile_db.createCollection('groups',{
                validation: {
                    '$and': [
                        {name: {'$type':'string'}}
                    ]
                }
            });
            yield groups.createIndex('name_index',{unique:true,background:true});
            var accou_pk = accounts.findOne({},{limit:1,sort:[['_id':-1]],fields:{_id:1}});
            var group_pk = groups.findOne({},{limit:1,sort:[['_id':-1]],fields:{_id:1}});
            if(accou_pk) {
                pk.accounts = parseInt(accou_pk._id,16);
            }
            if(group_pk) {
                pk.groups = parseInt(group_pk._id,16);
            }
            profile_connected = true;
            logger(`profile: ${username} is connected`);
            _dispatch('db','profile-connected',true);
        }).catch((error) => {
            profile_connected = false;
            logger('an error has occured when connecting to the profile db, error:',error.message);
            _dispatch('db','error',error);
        });
    }

    this.disconnectProfile = () => {
        co(function* () {
            yield profile_db.close();
            logger('profile db has closed');
            _dispatch('db','profile-closed');
        }).catch((error) => {
            logger('an error has occured when closing the profile db, error:',error.message);
            _dispatch('db','error',error);
        });
    }

    this.templates = (request) => {
        switch (request) {
            case 'account':
                return {
                    name: '',
                    username: '',
                    password: '',
                    is_email: false,
                    email: '',
                    group: {
                        _id: '',
                        name: '',
                    },
                    fields: []
                };
                break;
            case 'group':
                return {
                    name: ''
                };
                break;
            case 'profile':
                return {
                    name: '',
                    ref: '',
                    salt: '',
                    password: ''
                };
                break;
            default:
                logger(`unknown template request ${request}`);
                return {};
        }
    }

    this.profiles = _methods('profiles',profiles);

    this.accounts = _methods('accounts',accounts);

    this.groups = _methods('groups',groups);

    if(url && typeof url === 'string') {
        self.connect(url);
    }
}

module.exports = DBMinerva;
