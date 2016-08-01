const assert = require('assert');

const DataHandler = require('../lib/ProfileMan/DataHandler.js');

const handler = new DataHandler(true);

function makeAccount(pk,name,username,password,is_email,email,fields) {
    return {
        pk,
        data: {
            name,
            username,
            password,
            is_email,
            email,
            fields
        }
    }
};

describe('handler',function(){

    const group_one = {
        name: 'test',
        new_name: 'Test',
        pk: '1',
    }

    const group_two = {
        name: 'other',
        new_name: 'Other',
        pk: '2'
    }

    const group_three = {
        name: 'stuff',
        new_name: 'Stuff',
        pk: '3'
    }

    const accou_one = makeAccount('1','thing','dude1','123',true,'dude1@me.com',[]);

    const accou_two = makeAccount('2','other','dude1','1234',false,'thing',[]);

    const accou_three = makeAccount('3','stuff','dude1','12345',true,'dude1@dac.com',[]);

    describe('#initPKs()',function(){
        it('sets the pk values to 1',function(){
            handler.initPKs();
            assert.strictEqual(handler.getNextPK('account'),'1');
            assert.strictEqual(handler.getNextPK('group'),'1');
        });
    });

    describe('#getNextPK()',function(){
        it('returns the next pk value to be given to either an account or group',function(){
            assert(handler.getNextPK('account'));
            assert(handler.getNextPK('group'));
        });

        it('returns undefined if argument is not group or account',function(){
            assert(!handler.getNextPK());
            assert(!handler.getNextPK('thing'));
        });
    });

    describe('#data',function(){

        describe('#set()',function(){
            it('sets existing data to the handler',function(){
                assert(handler.data.set({
                    _pk: {
                        group: "35",
                        account: 'kdia5'
                    },
                    _emails: ['1','2','e'],
                    _groups: [{
                        pk: 'fe',
                        name: 'Cool',
                        ref: ['1','2','e']
                    }],
                    _accounts: {
                        '1': {
                            pk: '1',
                            name: 'google',
                            username: 'dude1',
                            password: 'stuff2',
                            is_email: true,
                            email: 'dude1@gmail.com',
                            fields: []
                        }
                    }
                }));
            });
        });

        describe('#get()',function(){
            it('returns the current data of the handler',function(){
                assert(handler.data.get());
            });
        });

        describe('#clear()',function(){
            it('clears all data from the handler',function(){
                assert(handler.data.clear());
                assert.strictEqual(handler.getNextPK('account'),'1');
                assert.strictEqual(handler.getNextPK('group'),'1');
            });
        });

    });

    describe('#account',function(){

        describe('#insert',function(){
            it('inserts a new account and returns the pk of the new account',function(){
                assert.strictEqual(handler.account.insert(accou_one.data),accou_one.pk);
            });
        })

    })


    describe('#group',function(){

        describe('#insert',function(){
            it('creates a new group with a given name',function(){
                assert.strictEqual(handler.group.insert(group_one.name),group_one.pk);
            });

            it('sends an event with the pk of the newly created group',function(done){
                handler.on('event',(ref,type,data) => {
                    if(ref === 'group' && type === 'insert') {
                        assert.strictEqual(data,group_two.pk);
                        handler.removeAllListeners();
                        done();
                    }
                });
                handler.group.insert(group_two.name);
            });
        });

        describe('#update',function(){
            it('updates the desired group with a new name',function(){
                handler.group.update(group_one.pk,group_one.new_name);
                var temp = handler.group.find(group_one.pk);
                assert.equal(temp[0].name,group_one.new_name);
            });

            it('sends an event with the pk of the updated group',function(done){
                handler.on('event',(ref,type,data) => {
                    if(ref === 'group' && type === 'update') {
                        var temp = handler.group.find(data);
                        assert.equal(temp[0].name,group_one.name);
                        handler.removeAllListeners();
                        done();
                    }
                });
                handler.group.update(group_one.pk,group_one.name);
            });
        });

        describe('#remove',function(){
            it('removes the desired group from the current data',function(){
                handler.group.remove(group_two.pk);
                assert(!handler.group.find(group_two.pk));
            });

            it('sends an event with the pk of the removed group',function(done){
                handler.on('event',(ref,type,data) => {
                    if(ref === 'group' && type === 'remove') {
                        assert(!handler.group.find(data));
                        handler.removeAllListeners();
                        done();
                    }
                });
                handler.group.remove(group_one.pk);
            });
        });

        handler.data.clear();

        describe('#find',function(){
            it('returns a list of all current groups',function(){
                handler.group.insert(group_one.name);
                handler.group.insert(group_two.name);
                handler.group.insert(group_three.name);
                var list = handler.group.find();
                assert.equal(list.length,3);
            });

            it('returns a specific class based on a pk value',function(){
                assert(handler.group.find(group_three.pk));
            });
        });

        describe('#addto',function(){

        });
    });
});
