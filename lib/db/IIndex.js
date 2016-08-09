const events = require('events');
const util = require('util');
const assert = require('assert');

const MongoClient = require('mongodb').MongoClient;
const co = require('co');

const CryptKeeper = require('../CryptKeeper.js');
const logging = require('../log.js');
require('../ProtoExtend.js');

const DBMinerva = function(url,options) {

    events.call(this);
    DBMinerva.prototype.__proto__ = events.prototype;

    const self = this;

    var connected = false;

    var client = undefined;

    var db = undefined;

    var profiles = undefined;

    // profile dependent variables

    var profile_connected = false;

    var profile_db = undefined;

    var groups = undefined;

    var accounts = undefined;

    var pk = {
        profiles: 1,
        groups: 1,
        accounts: 1
    }

    // private methods

    const logger = logging.logger('db');

    function dispatch(event,type,data) {
        self.emit(event,type,data);
    }

    function setNextPK(value) {
        if(value in pk) {
            var next = pk[value].toString(16);
            ++pk[value];
        } else {
            logger(`unknown pk request: ${value}`);
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
            dispatch('db','connected');
        }).catch((error) => {
            logger('error during connection and setup, error:',error.message);
            dispatch('db','error',error);
        });
    }

    this.disconnect = () => {
        co(function* () {
            yield db.close();
            profiles = undefined;
            logger('db has closed');
            dispatch('db','closed');
        }).catch((error) => {
            logger('an error has occured when closing db, error:',error.message);
            dispatch('db','error',error);
        });
    }

    this.connectProfile = (username) => {
        co(function* () {
            var doc = yield profiles.findOne({username},{limit:1,fields:{ref:1}});
            if(!doc) {
                profile_connected = false;
                logger('unable find profile, profile not connected');
                dispatch('db','profile-connected',false);
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
            dispatch('db','profile-connected',true);
        }).catch((error) => {
            profile_connected = false;
            logger('an error has occured when connecting to the profile db, error:',error.message);
            dispatch('db','error',error);
        });
    }

    this.disconnectProfile = () => {
        co(function* () {
            
        })
    }
}
