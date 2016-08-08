const assert = require('assert');

const DBMinerva = require('../lib/db/index.js');

const logging = require('../lib/log.js');

const settings = require('../settings.json');

const logger = logging.logger('mocha');

const db = new DBMinerva(`${settings.local.ip}:${settings.local.port}`,{debug: true});

db.on('db',(type,data) => {
    if(type === 'ready') {
        describe('#db',function(){

            describe('#profiles',function(){
                describe('#insert',function(){
                    it('inserts a new document with a name and password',function(done){
                        logger('running test for profiles.insert');
                        db.on('profiles',(type,data) => {
                            if(type === 'insert') {
                                db.profiles.find({_id: data});
                            }
                            if(type === 'find') {
                                assert(data);
                                assert.equal(data.username,'dac');
                                db.removeAllListeners('profiles');
                                done();
                            }
                        });
                        db.profiles.insert('dac','tds');
                    });
                });

                describe('#find',function(){
                    it('finds the desired document with a query',function(done){
                        logger('running test for profiles.find');
                        db.on('profiles',(type,data) => {
                            if(type === 'find') {
                                assert(data);
                                assert.equal(data.username,'dac');
                                db.removeAllListeners('profiles');
                                done();
                            }
                        });
                        db.profiles.find({username:'dac'});
                    });
                });

                describe('#update',function(){
                    it('updates the specified document with new data',function(done){
                        logger('running test for profiles.update');
                        db.on('profiles',(type,data) => {
                            if(type === 'update') {
                                db.profiles.find({_id: data});
                            }
                            if(type === 'find') {
                                assert(data);
                                assert.equal(data.username,'cad');
                                db.removeAllListeners('profiles');
                                done()
                            }
                        });
                        db.profiles.update({username: 'dac'},{username: 'cad'});
                    });
                });

                describe('#remove',function(){
                    it('removes the specified document and returns the id of the document removed',function(done){
                        logger('running test for profiles.remove');
                        db.on('profiles',(type,data) => {
                            if(type === 'remove') {
                                assert(data);
                                db.profiles.find({username: 'cad'});
                            }
                            if(type === 'find') {
                                assert(!data);
                                db.removeAllListeners('profiles');
                                done();
                            }
                        });
                        db.profiles.remove({username: 'cad'});
                    });
                });
            });

            describe('#connectProfile',function(){
                it('connects a user to their db',function(done){
                    db.on('db',(type,data) => {
                        if(type === 'profile-ready') {
                            db.removeAllListeners('db');
                            done();
                        }
                    });
                    db.on('profiles',(type,data) => {
                        if(type === 'insert') {
                            db.connectProfile('dac');
                            db.removeAllListeners('profiles');
                        }
                    });
                    db.profiles.insert('dac','tds');
                });
            });

            describe('#groups',function(){

                describe('#insert',function(){
                    it('inserts a new account with the given data',function(done){
                        logger('running test for groups.insert');

                        db.on('groups',(type,data) => {
                            if(type === 'insert') {
                                db.groups.findOne({_id: data});
                            }
                            if(type === 'findOne') {
                                assert(data);
                                assert.equal(data.name,'cool');
                                db.removeAllListeners('groups');
                                done();
                            }
                        });
                        db.groups.insert('cool');
                    });
                });

                describe('#findOne',function() {
                    it('returns a single group based on a query',function(){
                        logger('running test for groups.findOne');
                        db.on('groups',(type,data) => {
                            if(type === 'findOne') {
                                assert(!(data instanceof Array));
                                assert.equal(data.name,'cool');
                                db.removeAllListeners('groups');
                                done();
                            }
                        });
                        db.groups.findOne({name: 'cool'});
                    });
                });

                describe('#find',function(){
                    it('returns all groups based on a query',function(done){
                        logger('running test for groups.find');
                        db.on('groups',(type,data) => {
                            if(type === 'find') {
                                assert(data.length);
                                assert.equal(data[0].name,'cool');
                                db.removeAllListeners('groups');
                                done();
                            }
                        });
                        db.groups.find({name: 'cool'});
                    });
                });

                describe('#update',function(){
                    it('updates the specified group with new data',function(done){
                        logger('running test for groups.update');
                        db.on('groups',(type,data) => {
                            if(type === 'update') {
                                db.groups.findOne({_id: data});
                            }
                            if(type === 'findOne') {
                                assert(data);
                                assert.equal(data.name,'Cool stuff');
                                db.removeAllListeners('groups');
                                done();
                            }
                        });
                        db.groups.update({name: 'cool'},{name: 'Cool stuff'});
                    });
                });

                describe('#remove',function(){
                    it('removes the specified group based on a query',function(done){
                        logger('running test for groups.remove');
                        db.on('groups',(type,data) => {
                            if(type === 'remove') {
                                db.groups.findOne({_id: data});
                            }
                            if(type === 'findOne') {
                                assert(!data);
                                db.removeAllListeners('groups');
                                done();
                            }
                        });
                        db.groups.remove({name: 'Cool stuff'});
                    });
                })
            });

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
                group: {
                    _id: '2',
                    name: 'main'
                }
            }

            const autocad = {
                name: 'autocad',
                username: 'dac',
                password: 'tds',
                is_email: false,
                email: 'google',
                group: {
                    _id: '2',
                    name: 'main'
                },
                fields: []
            };

            const cool = {
                _id: '3',
                name: 'Cool'
            };

            describe('#accounts',function(){
                describe('#insert',function(){
                    it('inserts new account data to the db',function(done){
                        logger('running test for accounts.insert');
                        db.on('accounts',(type,data) => {
                            if(type === 'insert') {
                                db.accounts.findOne({_id: data});
                            }
                            if(type === 'findOne') {
                                assert(data);
                                assert.equal(data.name,yahoo.name);
                                assert.equal(data.username,yahoo.username);
                                assert(data.is_email);
                                assert.equal(data.email,yahoo.email);
                                db.removeAllListeners('accounts');
                                done();
                            }
                        });
                        db.accounts.insert(yahoo);
                    });

                    it('fails if the required fields are not valid',function(done){
                        logger('running test for accounts.insert');
                        db.on('accounts',(type,data) => {
                            if(type === 'error') {
                                assert.equal(data.code,121);
                                db.removeAllListeners('accounts');
                                done();
                            }
                        });
                        db.accounts.insert(bad);
                    });

                    it('set a new account to a group if given',function(done){
                        logger('running test for accounts.insert');
                        db.on('groups',(type,data) => {
                            if(type === 'insert') {
                                db.accounts.insert(google);
                            }
                        });
                        db.on('accounts',(type,data) => {
                            if(type === 'insert') {
                                db.accounts.findOne({_id: data});
                            }
                            if(type === 'findOne') {
                                assert(data);
                                assert.equal(data.group.name,google.group.name);
                                assert.equal(data.group._id,google.group._id);
                                db.removeAllListeners('accounts');
                                db.removeAllListeners('groups');
                                done();
                            }
                        });
                        db.groups.insert(google.group.name);
                    });
                });

                describe('#findOne',function(){
                    it('finds an account based on the desired query',function(done){
                        logger('running test for accounts.findOne');
                        db.on('accounts',(type,data) => {
                            if(type === 'findOne') {
                                assert(data);
                                assert.equal(data.name,google.name);
                                assert.equal(data.username,google.username);
                                db.removeAllListeners('accounts');
                                done();
                            }
                        });
                        db.accounts.findOne({name: google.name});
                    });
                });

                describe('#find',function(){
                    it('returns an array of all the documents found from a query',function(done) {
                        logger('running test for accounts.find');
                        db.on('accounts',(type,data) => {
                            if(type === 'insert') {
                                db.accounts.find({'group.name':google.group.name});
                            }
                            if(type === 'find') {
                                assert(data);
                                assert.equal(data.length,2);
                                db.removeAllListeners('accounts');
                                done();
                            }
                        });
                        db.accounts.insert(autocad);
                    });
                });

                describe('#updateOne',function(){
                    it('updates a single account based on a query with the given data',function(done){
                        logger('running test for accounts.updateOne');
                        db.on('accounts',(type,data) => {
                            if(type === 'updateOne') {
                                db.accounts.findOne({_id: data});
                            }
                            if(type === 'findOne') {
                                assert(data);
                                assert.equal(data.name,'Google');
                                db.removeAllListeners('accounts');
                                done();
                            }
                        });
                        db.accounts.updateOne({name: google.name},{name: 'Google'});
                    });
                });

                describe('#update',function(){
                    it('updates many accounts based on a query and gives them new data',function(done){
                        logger('running test for accounts.update');
                        db.on('groups',(type,data) => {
                            if(type === 'insert') {
                                db.groups.findOne({_id: data});
                            }
                            if(type === 'findOne') {
                                assert(data);
                                assert.deepEqual(data,cool);
                                db.accounts.update({'group.name':'main'},{group: data});
                            }
                        });
                        db.on('accounts',(type,data) => {
                            if(type === 'update') {
                                assert.equal(data,2);
                                db.accounts.find({'group.name':cool.name});
                            }
                            if(type === 'find') {
                                assert(data);
                                assert.equal(data.length,2);
                                db.removeAllListeners('accounts');
                                db.removeAllListeners('groups');
                                done();
                            }
                            if(type === 'error') {
                                console.log(data);
                            }
                        });
                        db.groups.insert(cool.name);
                    });
                });

                describe('#removeOne',function(){
                    it('removes a single account based on a query',function(done){
                        logger('running test for accounts.removeOne');
                        db.on('accounts',(type,data) => {
                            if(type === 'removeOne') {
                                assert(data);
                                db.accounts.findOne({_id:data});
                            }
                            if(type === 'findOne') {
                                assert(!data);
                                db.removeAllListeners('accounts');
                                done();
                            }
                        });
                        db.accounts.removeOne({name: yahoo.name});
                    });
                });

                describe('#remove',function(){
                    it('removes any account that matches the given query',function(done){
                        logger('running test for accounts.remove');
                        db.on('accounts',(type,data) => {
                            if(type === 'remove') {
                                assert.equal(data,2);
                                db.accounts.find();
                            }
                            if(type === 'find') {
                                assert.equal(data.length,0);
                                db.removeAllListeners('accounts');

                                done();
                            }
                        });
                        db.accounts.remove({'group.name':cool.name});
                    });
                });
            });
        });
    }
    if(type === 'error') {
        console.log(data);
    }
});
