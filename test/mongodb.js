const assert = require('assert');
const util = require('util');
const co = require('co');
const chai = require('chai');
const chaiPromise = require('chai-as-promised');

const expect = chai.expect;
const should = chai.should();

chai.use(chaiPromise);

const DBMinerva = require('../lib/db/DBMinerva.js');

const CryptKeeper = require('../lib/CryptKeeper.js');

const logging = require('../lib/log.js');

const settings = require('../settings.json');

const logger = logging.logger('mocha');

const db = new DBMinerva();

function checkConnection(done) {
    return co(function* () {
        var connections = db.connections();
        if(!connections.main) {
            var check = yield db.connect(`${settings.local.ip}:${settings.local.port}`);
            if(check) {
                return yield db.initMain();
            } else {
                return Promise.resolve(false);
            }
        }
        return yield Promise.resolve(true);
    }).then((val) => {
        if(val) done();
        else done(val);
    });
}

const yahoo = {
    name:'yahoo',
    username: 'dac',
    password: 'tds',
    is_email: true,
    email: 'dac@yahoo.com'
};

const bad = {
    dude: 'other',
    name: 'thing',
    username: 'dac',
    is_email: 'nope',
    email: false
};

const google = {
    name: 'google',
    username: 'dac',
    password: 'tds',
    is_email: true,
    email: 'dac@gmail.com',
    group: ['main']
}

const autocad = {
    name: 'autocad',
    username: 'dac',
    password: 'tds',
    is_email: false,
    email: 'google',
    group: ['main'],
    fields: []
};

const user1 = {
    username: 'phil',
    password: 'tds',
    salt: CryptKeeper.getSalt(),
    ref: '10'
}

const user2 = {
    username: 'steve',
    password: 'heo',
    salt: '',
    ref: '',
}

const user3 = {
    username: 'mike',
    password: 'dude',
    salt: '',
    ref: '',
}

const user1dup = {
    username: 'phil',
    password: 'tds',
    salt: CryptKeeper.getSalt(),
    ref: ''
}

describe('#db',function(){

    describe('#connect',function() {
        it('connects to the desired database',function() {
            return expect(co(function* () {
                return yield db.connect(`${settings.local.ip}:${settings.local.port}`)
            })).to.eventually.be.true;
        });

        it('passes if there is already a connection',function() {
            return expect(co(function* () {
                return yield db.connect();
            })).to.eventually.be.true;
        });
    });

    describe('#disconnect',function() {
        it('disconnects from the current database if there is a connection',function() {
            return expect(co(function* () {
                return yield db.disconnect();
            })).to.eventually.be.true;
        });

        it('should fail if there is no connection',function() {
            return expect(co(function* () {
                return yield db.disconnect();
            })).to.eventually.be.rejected;
        });
    });

    describe('#initMain',function() {

        before('checking for connection',function(done) {
            return checkConnection(done);
        });

        it('creates the connection to the profiles collection',function(){
            return expect(co(function* () {
                return yield db.initMain();
            })).to.eventually.be.true;
        });

        it('passes if a connection already exists',function() {
            return expect(co(function* () {
                return yield db.initMain();
            })).to.eventually.be.true;
        });

        it('fails if there is no connection',function() {
            return expect(co(function* () {
                yield db.disconnect();
                yield db.initMain();
            })).to.eventually.be.rejected;
        })
    });

    describe('#profile',function() {

        before('checking for connection',function(done) {
            return checkConnection(done);
        });

        describe('#insert',function() {
            it('inserts a single document to the db',function() {
                return expect(co(function* () {
                    var result = yield db.profiles.insert(user1);
                    if(result.result.ok) {
                        return yield Promise.resolve(true);
                    } else {
                        return yield Promise.resolve(false);
                    }
                })).to.eventually.be.true;
            });

            it('inserts multiple documents to the db',function() {
                return expect(co(function* () {
                    var result = yield db.profiles.insert([user2,user3]);
                    return yield Promise.resolve(result.result.ok && result.insertedIds.length === 2);
                })).to.eventually.be.true;
            });

            it('fails if the username field is a duplicate',function() {
                return expect(co(function* () {
                    yield db.profiles.insert(user1dup);
                })).to.eventually.be.rejected;
            });

            it('fails if the documents do not pass validation',function() {
                return expect(co(function* () {
                    try {
                        var result = yield db.profiles.insert({thing:'other'});
                        console.log('result:',result);
                        return yield Promise.resolve(result);
                    } catch(err) {
                        return yield Promise.reject(err);
                    }
                })).to.eventually.be.rejected;
            });
        });

        describe('#find',function() {
            it('finds documents based on a query',function() {
                return expect(co(function* () {
                    return yield db.profiles.find({});
                })).to.eventually.have.length(3);
            });

            it('finds documents based on a query with options given',function() {
                return expect(co(function* () {
                    return yield db.profiles.find({},{limit:1});
                })).to.eventually.have.length(1);
            });

            it('contiues if an option is invalid',function() {
                return expect(co(function* () {
                    return yield db.profiles.find({},{thing:2});
                })).to.eventually.have.length(3);
            });

            it('will find all if no query is given',function() {
                return expect(co(function* () {
                    return yield db.profiles.find();
                })).to.eventually.have.length(3);
            });
        });

        describe('#update',function() {
            it('updates a selected document with new data',function() {
                return expect(co(function* () {
                    yield db.profiles.update({username:'phil'},{'$set': {password:'bad'}});
                    return yield db.profiles.find({username:'phil',password:'bad'});
                })).to.eventually.have.length(1);
            });

            it('updates multiple documents with given data',function() {
                return expect(co(function* () {
                    yield db.profiles.update({salt: ''},{'$set': {salt: 'thing'}},{multi:true});
                    return yield db.profiles.find({salt: 'thing'});
                })).to.eventually.have.length(2);
            });
        });

        describe('#remove',function() {
            it('removes any document based on a query',function() {
                return expect(co(function* () {
                    yield db.profiles.remove({username:'phil'});
                    return yield db.profiles.find({username:'phil'});
                })).to.eventually.have.length(0);
            });

            it('removes all documents if no query is given',function() {
                return expect(co(function* () {
                    yield db.profiles.remove();
                    return yield db.profiles.find();
                })).to.eventually.have.length(0);
            });
        });
    });

    describe('#connectProfileDB',function() {

        before(function(done) {
            return co(function* () {
                var docs = yield db.profiles.find({username:'phil'});
                if(docs.length !== 1) {
                    yield db.profiles.insert(user1);
                    return yield Promise.resolve(true);
                } else {
                    return yield Promise.resolve(true);
                }
            }).then((val) => done());
        });

        it('connects the given profile to its designated db',function() {
            return expect(co(function* () {
                var doc = yield db.profiles.find({username:'phil'});
                return yield db.connectProfileDB(doc[0]);
            })).to.eventually.be.true;
        });

        it('should pass if a connection exists',function() {
            return expect(co(function* () {
                return yield db.connectProfileDB();
            })).to.eventually.be.true;
        });

        it('fails if there is no connection',function() {
            return expect(co(function* () {
                yield db.disconnect();
                yield db.connectProfileDB();
            })).to.eventually.be.rejected;
        })
    });

    describe('#initProfileDB',function() {

        before(function(done) {
            return checkConnection(done);
        });

        it('initializes the accounts collection for the connected profile',function() {
            return expect(co(function* () {
                var doc = yield db.profiles.find({username:'phil'});
                yield db.connectProfileDB(doc[0]);
                return yield db.initProfileDB();
            })).to.eventually.be.true;
        });

        it('passes if it has already been initialized',function() {
            return expect(co(function* () {
                return yield db.initProfileDB();
            })).to.eventually.be.true;
        });

        it('fails if there is no connection',function() {
            return expect(co(function* () {
                yield db.disconnect();
                yield db.initProfileDB();
            })).to.eventually.be.rejected;
        });
    });

    describe('#disconnectProfileDB',function() {
        before(function(done) {
            return checkConnection(done);
        });

        it('disconnects from the current profile db',function() {
            return expect(co(function* () {
                var doc = yield db.profiles.find({username:'phil'});
                yield db.connectProfileDB(doc[0]);
                return yield db.disconnectProfileDB();
            })).to.eventually.be.true;
        });

        it('fails if there is no connection',function() {
            return expect(co(function* () {
                yield db.disconnectProfileDB();
            })).to.eventually.be.rejected;
        });
    });

});
