const events = require('events');
const util = require('util');
const assert = require('assert');

const MongoClient = require('mongodb').MongoClient;
const CryptKeeper = require('../CryptKeeper.js');
const logging = require('../log.js');
require('../ProtoExtend.js');

const dbe = new events.EventEmitter();

const DBMinerva = function(url,options) {

    events.call(this);
    DBMinerva.prototype.__proto__ = events.prototype;

    const self = this;

    var connected = false;

    var client = undefined;

    var db = undefined;

    var accounts = undefined;

    var groups = undefined;

    var profiles = undefined;

    var profile_db = undefined;

    var pk = {
        profiles: 1,
        groups: 1,
        accounts: 1,
    };

    const logger = logging.logger('db');

    function dispatch(event,type,data) {
        self.emit(event,type,data);
    }

    function templates(request) {
        if(typeof request !== 'string') {
            logger(`request argument must be a string`);
            return undefined;
        }
        switch (request) {
            case 'account':
                return {
                    _id: '',
                    name: "",
                    username: "",
                    password: "",
                    is_email: false,
                    email: "",
                    group: {
                        _id: '',
                        name: '',
                    },
                    fields: [],
                };
                break;
            case 'group':
                return {
                    _id: '',
                    name: '',
                };
                break;
            case 'profile':
                return {
                    _id: '',
                    username: '',
                    salt: '',
                    password: '',
                    ref: ''
                };
                break;
            default:
                logger(`unknown template request: ${request}`);
                return undefined;
        }
    }

    function setPK(request) {
        if(request in pk) {
            var rtn = pk[request].toString(16);
            ++pk[request];
            return rtn;
        } else {
            logger(`unknown pk request: ${request}`);
            return undefined;
        }
    }

    function initPKs(run_query = {}) {
        var options = {sort: {_id: -1}};
        if(run_query.accounts) {
            accounts.findOne({},options,(err,doc) => {
                if(err) {
                    logger('error when setting accounts pk, error:',err.message);
                    dbe.emit('pk-accounts','error');
                } else {
                    if(doc) {
                        logger('setting pk from highest account found')
                        pk.accounts = parseInt(doc._id,16);
                        dbe.emit('pk-accounts','ready');
                    } else {
                        logger('no accounts found accounts pk unchanged')
                        dbe.emit('pk-accounts','ready')
                    }
                }
            });
        }
        if(run_query.groups) {
            groups.findOne({},options,(err,doc) => {
                if(err) {
                    logger('error when setting groups pk, error:',err.message);
                    dbe.emit('pk-groups','error');
                } else {
                    if(doc) {
                        logger('setting pk from highest group found');
                        pk.groups = parseInt(doc._id,16);
                        dbe.emit('pk-groups','ready');
                    } else {
                        logger('no groups found groups pk unchanged');
                        dbe.emit('pk-groups','ready');
                    }
                }
            });
        }
        if(run_query.profiles) {
            profiles.findOne({},options,(err,doc) => {
                if(err) {
                    logger('error when setting profiles pk, error:',err.message);
                    dbe.emit('pk-profiles','error');
                } else {
                    if(doc) {
                        logger('setting pk from highest profile found');
                        pk.profiles = parseInt(doc._id,16);
                        dbe.emit('pk-profiles','ready');
                    } else {
                        logger('no profiles found profiles pk unchanged');
                        dbe.emit('pk-profiles','ready');
                    }
                }
            });
        }
    }

    function compareTypes(value_one,value_two) {
        return typeof value_one === typeof value_two && Array.isArray(value_one) === Array.isArray(value_two);
    }

    function checkArray(check_arr,against_arr) {
        var result = {
            valid: true,
            keys: []
        }
        for(var c = 0,len = check_arr.length; c < len; ++c) {

        }
    }

    function checkObject(check_obj,against_obj) {
        var result = {
            valid: true,
            keys: []
        };
        for(const key in check_obj) {
            if(!key in against_obj) {
                result.valid = false;
                result.keys.push(key);
            } else {
                if(against_obj[key] instanceof Array && against_obj[key].length === 1) {

                }
            }
            if(!compareTypes(check_obj[key],against_obj[key])) {
                result.valid = false;
                result.keys.push(key);
            }
        }
        return result;
    }

    function setDBEvents(connection_ref) {
        connection_ref.on('error',(err) => {
            logger('client connection error',err.message);
            dispatch('db','error',err);
        });

        connection_ref.on('reconnect',(result) => {
            connected = true;
            logger('db reconnected to mongodb',result);
            dispatch('db','connected');
        });
    }

    this.connect = (url) => {
        client = MongoClient.connect(`mongodb://${url}/minerva`,(err,db_ref) => {
            if(err) {
                logger(`error connecting to mongodb, error: ${err.message}`);
                dispatch('db','error',err);
            } else {
                db = db_ref;
                setDBEvents(db);
                profiles = db.collection('profiles');
                logger(`connection established with mongodb://${url}/minerva`);
                dispatch('db','connected');
                connected = true;
                dbe.on('pk-profiles',(type) => {
                    if(type === 'ready') {
                        dispatch('db','ready');
                    }
                });
                initPKs({profiles:true});
            }
        });
    }

    this.disconnect = () => {
        if(!connected) {
            logger('client is not connected to mongodb');
        } else {
            db.close((err,result) => {
                if(err) {
                    logger(err.message);
                    dispatch('db','error',err);
                } else {
                    logger('disconnected from mongodb');
                    dispatch('db','closed');
                }
            });
        }
    }

    this.connectProfile = (username) => {
        logger('connecting profile db for user:',username);
        profiles.findOne({username},(err,doc) => {
            if(err) {
                logger('error when searching for profile:',username);
                dispatch('db','error',err);
            } else {
                if(doc) {
                    logger('connecting to user db');
                    profile_db = db.db(doc.ref);
                    groups = profile_db.collection('groups');
                    profile_db.createCollection('accounts',{
                        validator: {
                            '$and': [
                                {name: {'$type':'string'}},
                                {username:{'$type':'string'}},
                                {password:{'$type':'string'}},
                                {is_email:{'$type':'bool'}},
                                {email:{'$type':'string'}}
                            ]
                        },
                        '$or': [
                            {group:{
                                _id:{'$type':'objectId'},
                                name:{'$type':'string'}
                            }},
                            {fields:{'$type':'array'}}
                        ]
                    },(err,collection) => {
                        if(err) {
                            logger('error when creating accounts collection, error:',err.message);
                            dispatch('db','error',err);
                        } else {
                            accounts = collection;
                            var pk_account_set = false;
                            var pk_group_set = false;
                            dbe.on('pk-accounts',(type) => {
                                if(type === 'ready') {
                                    pk_account_set = true;
                                    if(pk_account_set && pk_group_set) {
                                        logger('db ready for use');
                                        dispatch('db','profile-ready');
                                    }
                                    dbe.removeAllListeners('pk-accounts');
                                }
                            });
                            dbe.on('pk-groups',(type) => {
                                if(type === 'ready') {
                                    pk_group_set = true;
                                    if(pk_account_set && pk_group_set) {
                                        logger('db ready for use');
                                        dispatch('db','profile-ready');
                                    }
                                    dbe.removeAllListeners('pk-groups');
                                }
                            });
                            initPKs({groups:true,accounts:true});
                        }
                    });
                } else {
                    logger('unable to connect to user db');
                    dispatch('db','error','user not found');
                }
            }
        });
    }

    this.profiles = {
        insert: (username,password) => {
            logger(`inserting new profile with username: ${username}`);
            profiles.findOne({username},(err,doc) => {
                if(err) {
                    logger(`error when checking new profile username, error ${err.message}`);
                    dispatch('profiles','find_error',err);
                } else {
                    if(!doc) {
                        logger(`inserting profile: ${username}`);
                        var tmplt = templates('profile');
                        tmplt._id = pk.profiles.toString(16);
                        tmplt.username = username;
                        tmplt.salt = CryptKeeper.getSalt();
                        tmplt.password = CryptKeeper.getHash(password,tmplt.salt);
                        tmplt.ref = tmplt._id;
                        profiles.insert(tmplt,(error,result) => {
                            if(err) {
                                logger(`error when inserting new profile, error: ${error.message}`);
                                dispatch('profiles','error',error);
                            } else {
                                logger(`profile: ${result.insertedIds[0]} inserted`);
                                setPK('profiles');
                                dispatch('profiles','insert',result.insertedIds[0]);
                            }
                        })
                    } else {
                        logger(`username: ${username} already exists`);
                        dispatch('profiles','insert',doc._id);
                    }
                }
            });
        },
        update: (query = {},data = {}) => {
            logger('finding profile based on query:',query);
            profiles.findOneAndUpdate(query,{'$set': data},(err,result) => {
                if(err) {
                    logger('error during update:',err.message);
                    dispatch('profiles','error',err);
                } else {
                    if(result.ok) {
                        logger(`document: ${result.value._id} updated`);
                        dispatch('profiles','update',result.value._id);
                    } else {
                        logger('update did not execute correctly');
                        dispatch('profiles','update',undefined);
                    }
                }
            });
        },
        remove: (query = {}) => {
            logger('finding profile based on query:',query);
            profiles.findOneAndDelete(query,(err,result) => {
                if(err) {
                    logger('error during remove:',err.message);
                    dispatch('profiles','error',err);
                } else {
                    if(result.ok) {
                        logger(`document: ${result.value._id} removed`);
                        dispatch('profiles','remove',result.value._id);
                    } else {
                        logger('remove did not execute correctly');
                        dispatch('profiles','remove',undefined);
                    }
                }
            });
        },
        find: (query = {}) => {
            logger(`finding profile based on query: ${util.inspect(query,{depth:null})}`);
            profiles.findOne(query,(err,doc) => {
                if(err) {
                    logger(`error when finding document: ${util.inspect(query,{depth:null})}`);
                    dispatch('profiles','error',err);
                } else {
                    if(doc) {
                        logger('found document:',query);
                        dispatch('profiles','find',doc);
                    } else {
                        logger('unable to find document:',query);
                        dispatch('profiles','find',undefined);
                    }
                }
            });
        }
    }

    this.groups = {
        insert: (name) => {
            logger(`inserting new group: ${name}`);
            groups.findOne({name},(err,doc) => {
                if(err) {
                    logger(`error when checking group name: ${name}`);
                    dispatch('groups','error',err);
                } else {
                    if(!doc) {
                        var tmplt = templates('group');
                        tmplt._id = pk.groups.toString(16);
                        tmplt.name = name;
                        groups.insertOne(tmplt,(error,result) => {
                            if(error) {
                                logger(`error when inserting new group, error: ${error.message}`);
                                dispatch('groups','error',error);
                            } else {
                                if(result.result.ok) {
                                    logger(`group: ${util.inspect(result.insertedId,{depth:null})} inserted`);
                                    setPK('groups');
                                    dispatch('groups','insert',result.insertedId);
                                } else {
                                    logger(`insert did not execute correctly`);
                                    dispatch('groups','insert',undefined);
                                }
                            }
                        });
                    } else {
                        logger(`group: ${name} exists`);
                        dispatch('groups','insert',doc._id);
                    }
                }
            });
        },
        update: (query = {},data = {}) => {
            logger(`updating group based on query:`,query);
            groups.findOneAndUpdate(query,{'$set': data},(err,result) => {
                if(err) {
                    logger(`error when updating group, error: ${err.message}`);
                    dispatch('groups','error',err);
                } else {
                    if(result.ok) {
                        logger(`group:`,query,`updated`);
                        dispatch('groups','update',result.value._id);
                    } else {
                        logger('update did not execute correctly');
                        dispatch('groups','update',undefined);
                    }
                }
            });
        },
        remove: (query = {}) => {
            logger(`removing group based on query:`,query);
            groups.findOneAndDelete(query,(err,result) => {
                if(err) {
                    logger(`error when removing group, error: ${err.message}`);
                    dispatch('groups','error',err);
                } else {
                    if(result.ok) {
                        logger(`group:`,query,'removed');
                        dispatch('groups','remove',result.value._id);
                    } else {
                        logger('remove did not execute correctly');
                        dispatch('groups','remove',undefined);
                    }
                }
            });
        },
        find: (query = {},options = {}) => {
            logger(`finding groups based on query:`,query);
            var cursor = groups.find(query);
            if(options.sort) {
                cursor = cursor.sort(options.sort);
            }
            cursor.toArray((err,docs) => {
                if(err) {
                    logger('errror when setting cursor to array, error:',err.message);
                    dispatch('groups','error',err);
                } else {
                    logger(`${docs.length} documents found from query:`,query);
                    dispatch('groups','find',docs);
                }
            });
        },
        findOne: (query = {}) => {
            logger('finding group based on query:',query);
            groups.findOne(query,(err,doc) => {
                if(err) {
                    logger(`error when finding group:`,query,`, error: ${err.message}`);
                    dispatch('groups','error',err);
                } else {
                    if(doc) {
                        logger('found group:',query);
                        dispatch('groups','findOne',doc);
                    } else {
                        logger('unable to find group:',query);
                        dispatch('groups','findOne',undefined);
                    }
                }
            });
        }
    }

    function insertAccount(data) {
        data._id = pk.accounts.toString(16);
        accounts.insertOne(data,(err,result) => {
            if(err) {
                logger(`error when inserting account, ${err.message}`);
                dispatch('accounts','error',err);
            } else {
                if(result.result.ok) {
                    logger(`account: ${result.insertedId} inserted`);
                    setPK('accounts');
                    dispatch('accounts','insert',result.insertedId);
                } else {
                    logger('insert did not execute correctly');
                    dispatch('accounts','insert',undefined);
                }
            }
        });
    }

    this.accounts = {
        insert: (data) => {
            logger(`inserting new account: ${data.name}`);
            accounts.findOne({name: data.name},(err,doc) => {
                if(err) {
                    logger(`error when checking account data, error: ${err.message}`);
                    dispatch('accounts','error',err);
                } else {
                    if(!doc) {
                        var name_exist = (data.group) ? typeof data.group.name !== 'undefined' : false;
                        var _id_exist = (data.group) ? typeof data.group._id !== 'undefined' : false;
                        if(name_exist && _id_exist) {
                            logger('checking group based on query:',data.group);
                            groups.findOne({name: data.group.name,_id: data.group._id},(error,docu) => {
                                if(err) {
                                    logger(`error when finding group, error: ${error.message}`);
                                    dispatch('accounts','error',error);
                                } else {
                                    if(!docu) {
                                        logger(`unable to validate group: ${data.group.name} for account`);
                                        data.group.name = '';
                                        data.group._id = '';
                                    }
                                    insertAccount(data);
                                }
                            });
                        } else {
                            insertAccount(data);
                        }
                    } else {
                        logger(`account: ${data.name} already exists`);
                        dispatch('accounts','insert',doc._id);
                    }
                }
            });
        },
        updateOne: (query = {},data = {}) => {
            logger('updating account based on query:',query);
            accounts.findOneAndUpdate(query,{'$set': data},(err,result) => {
                if(err) {
                    logger('error when updating account, error:',err.message);
                    dispatch('accounts','error',err);
                } else {
                    if(result.ok) {
                        logger(`account: ${result.value._id} updated`);
                        dispatch('accounts','updateOne',result.value._id);
                    } else {
                        logger('updateOne did not execute correctly');
                        dispatch('accounts','updateOne',undefined);
                    }
                }
            });
        },
        update: (query = {},data = {}) => {
            logger('updating accounts based on query:',query);
            accounts.update(query,{'$set': data},{multi:true},(err,result) => {
                if(err) {
                    logger('error when updating account, error:',err.message);
                    dispatch('accounts','error',err);
                } else {
                    if(result.result.ok) {
                        logger(`${result.result.nModified} accounts updated`);
                        dispatch('accounts','update',result.result.nModified);
                    } else {
                        logger('update did execute correctly');
                        dispatch('accounts','update',undefined);
                    }
                }
            });
        },
        removeOne: (query = {}) => {
            logger(`removing account based on query:`,query);
            accounts.findOneAndDelete(query,(err,result) => {
                if(err) {
                    logger('error when removing account, error:',err.message);
                    dispatch('accounts','error',err);
                } else {
                    if(result.ok) {
                        logger(`document: ${result.value._id} removed`);
                        dispatch('accounts','removeOne',result.value._id);
                    } else {
                        logger('remove did not execute correctly');
                        dispatch('accounts','removeOne',undefined);
                    }
                }
            });
        },
        remove: (query = {}) => {
            logger(`removing accounts based on query:`,query);
            accounts.remove(query,(err,result) => {
                if(err) {
                    logger('error when removing accounts, error:',err.message);
                    dispatch('accounts','error',err);
                } else {
                    if(result.result.ok) {
                        logger(`${result.result.n} accounts removed`);
                        dispatch('accounts','remove',result.result.n);
                    } else {
                        logger('remove did not execute correctly');
                        dispatch('accounts','remove',undefined);
                    }
                }
            });
        },
        findOne: (query = {}) => {
            logger(`finding account based on query:`,query);
            accounts.findOne(query,(err,doc) => {
                if(err) {
                    logger('error when finding account, error:',err.message);
                    dispatch('accounts','error',err);
                } else {
                    if(doc) {
                        logger('found account:',query);
                        dispatch('accounts','findOne',doc);
                    } else {
                        logger(`unable to find account:`,query);
                        dispatch('accounts','findOne',undefined);
                    }
                }
            });
        },
        find: (query = {},options = {}) => {
            logger(`finding account based on query:`,query);
            var cursor = accounts.find(query);
            if(options.sort) {
                cursor = cursor.sort(options.sort);
            }
            if(options.project) {
                cursor = cursor.project(options.project);
            }
            cursor.toArray((err,docs) => {
                if(err) {
                    logger('error when finding accounts, error:',err.message);
                    dispatch('accounts','error',err);
                } else {
                    logger(`${docs.length} documents found from query:`,query);
                    dispatch('accounts','find',docs);
                }
            });
        }
    }

    if(url && typeof url === 'string') {
        self.connect(url);
    }
}

module.exports = DBMinerva;
