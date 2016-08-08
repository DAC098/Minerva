const assert = require('assert');
const util = require('util');

const DataHandler = require('../lib/ProfileMan/DataHandler.js');

const handler = new DataHandler();
/*
var num = new Number();
var str = new String();
var obj = {other: true,stuff: 'thing'};
var arr = [5,6,7];
var bol = new Boolean();

const Cool = function Cool() {

}

var cl = new Cool();

console.log('string instance of string',str instanceof String,str instanceof Object);
console.log('number instance of number',num instanceof Number,num instanceof Object);
console.log('object instance of object',obj instanceof Object);
console.log('array instance of array',arr instanceof Array,arr instanceof Object);
console.log('boolean instance of boolean',bol instanceof Boolean,bol instanceof Object);
console.log('Cool instance of Cool',cl instanceof Cool,cl instanceof Object);
*/
function makeAccount(pk,name,username,password,is_email,email,group,fields) {
    var rtn = {
        pk
    };
    if(pk){
        rtn.pk = pk;
    }
    if(name) {
        rtn['name'] = name;
    }
    if(username) {
        rtn['username'] = username;
    }
    if(password) {
        rtn['password'] = password;
    }
    if(typeof is_email === 'boolean') {
        rtn['is_email'] = is_email;
    }
    if(email) {
        rtn['email'] = email;
    }
    if(group) {
        rtn['group'] = group;
    }
    if(fields) {
        rtn['fields'] = fields;
    }
    return rtn;
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

    const accou_one = makeAccount('1','thing','dude1','123',true,'dude1@me.com',null,[]);

    const accou_one_update = makeAccount('1','other',null,'12347',false,'stuff');

    const accou_two = makeAccount('2','other','dude1','1234',false,'thing');

    const accou_three = makeAccount('3','cool','dude1','0000',false,'stuff','1');

    const accou_three_update = makeAccount('3',null,null,null,null,null,'2');

    const accou_four = makeAccount('4','stuff','dude1','12345',true,'dude1@dac.com',null,[]);

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
                assert.strictEqual(handler.account.insert(accou_one),accou_one.pk);
            });

            it('fails if there is an unknown key passed it',function(){
                assert(!handler.account.insert({thing:'other',stuff:'cool',is_email:true}));
            });

            it('fills in missing keys if the data passed validation',function(){
                assert.strictEqual(handler.account.insert(accou_two),accou_two.pk);
            });

            it('updates groups if a group pk is given',function(){
                handler.group.insert(group_one.name);
                assert.strictEqual(handler.account.insert(accou_three),accou_three.pk);
                var list = handler.group.find(group_one.pk);
                assert.equal(list[0].ref.length,1);
            });

            it('sends an event from account with the new pk added',function(done){
                handler.on('event',(ref,type,data) => {
                    if(ref === 'account' && type === 'insert') {
                        assert.strictEqual(data,accou_four.pk);
                        handler.removeAllListeners('event');
                        done();
                    }
                });
                handler.account.insert(accou_four);
            });
        });

        describe('#update',function(){
            it('updates a sepcified account with new data',function(){
                handler.account.update(accou_one.pk,accou_one_update);
                assert.notStrictEqual(accou_one.name,accou_one_update.name);
            });

            it('updates an groups if a group pk is given',function(){
                handler.group.insert(group_two.name);
                assert.strictEqual(handler.account.update(accou_three.pk,accou_three_update),accou_three.pk);
                var list_one = handler.group.find(group_two.pk);
                var list_two = handler.group.find(group_one.pk);
                assert.strictEqual(list_one[0].ref.length,1);
                assert.strictEqual(list_two[0].ref.length,0);
            });

            it('sends an event when an account has been changed',function(done){
                handler.on('event',(ref,type,data) => {
                    if(ref === 'account' && type === 'update') {
                        var temp = handler.account.find(data);
                        assert.notStrictEqual(accou_one_update.name,temp.name);
                        handler.removeAllListeners('event');
                        done();
                    }
                });
                handler.account.update(accou_one_update.pk,accou_one);
            });
        });

        describe('#remove',function(){
            it('removes the desired accout from the data',function(){
                handler.account.remove(accou_one.pk);
                var found = handler.account.find(accou_one.pk);
                assert(!found);
            });

            it('sends an event with the account pk removed',function(done){
                handler.on('event',(ref,type,data) => {
                    if(ref === 'account' && type === 'remove') {
                        var found = handler.account.find(data);
                        assert(!found);
                        handler.removeAllListeners('event');
                        done();
                    }
                });
                handler.account.remove(accou_three.pk);
            });
        });

    });


    describe('#group',function(){

        describe('#insert',function(){
            it('creates a new group with a given name',function(){
                handler.data.clear();
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
            it('adds accounts to a specified group',function(){
                handler.account.insert(accou_one);
                handler.group.addTo()
            });
        });
    });
});
