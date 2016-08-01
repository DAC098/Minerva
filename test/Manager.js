const assert = require('assert');
const fs = require('fs');
const path = require('path');

const Manager = require('../lib/ProfileMan');

const Minerva_path = path.join(process.env.HOME,'.minerva');

try {
    var status = fs.statSync(Minerva_path);
    if(status.isDirectory()) {
        var list = fs.readdirSync(Minerva_path);
        for(var index of list) {
            try{
                fs.unlinkSync(path.join(Minerva_path,index));
            } catch(err) {
                console.log(`unable to remove file ${index}:`,err.message);
            }
        }
        try{
            fs.rmdirSync(Minerva_path);
        }catch(err) {
            console.log('error when removing .minerva');
        }
    }
} catch(err) {
    if(err.code !== 'ENOENT') {
        console.log('error when cleaning directory .minerva',err.message);
    }
}

const manager = new Manager();

describe('manager',function() {

    describe('#load()',function() {
        it('should return true when complete',function() {
            assert(manager.load());
        });
    });

    describe('#save()',function() {
        it('should send the saved event when complete',function(done) {
            manager.on('event',(ref,type,data) => {
                if(ref === 'manager' && type === 'saved') {
                    manager.removeAllListeners('event');
                    done();
                }
            });
            manager.save();
        });
    });

    describe('#users()',function() {
        it('should return a list of current users',function() {
            var list = manager.users();
            assert(Array.isArray(list));
        });
    });

    describe('#profile',function() {
        const user_one = {
            username: 'dude1',
            password: 'coolman',
        }

        const user_two = {
            username: 'man3',
            password: 'walkingstiff'
        }

        describe('#create()',function() {
            it('should return true when the user has been created',function() {
                assert(manager.profile.create(user_one.username,user_one.password));
            });

            it('should return true if the user profile alread exists',function() {
                assert(manager.profile.create(user_one.username,user_one.password));
            });
        });

        describe('#find()',function(){
            it('should return false if user does not exists',function(){
                assert(!manager.profile.find(user_two.username));
            });

            it('should return true if user exists',function() {
                assert(manager.profile.find(user_one.username));
            });
        });

        describe('#load()',function(){
            it('should return true if user is already logged in',function(){
                assert(manager.profile.load(user_one.username,user_one.password));
            });

            it('should be able to log the user out and then log back in',function(){
                assert(manager.profile.clear());
                assert(manager.profile.load(user_one.username,user_one.password));
            });

            it('should fail if user is logged in but password is invalid',function(){
                assert(!manager.profile.load(user_one.username,user_two.password));
            });

            it('should fail if one or both arguments are not strings',function(){
                assert(manager.profile.clear());
                assert(!manager.profile.load(user_one.username,true));
                assert(!manager.profile.load(true,user_one.password));
                assert(!manager.profile.load(true,true));
            });
        });

        describe('#hasChanged()',function(){
            it('should be true if any data has changed',function(){
                assert(manager.profile.clear());
                assert(manager.profile.load(user_one.username,user_one.password));
                assert(manager.profile.hasChanged());
            });
        });

        describe('#clear()',function(){
            it('should clear the current profile of data',function(){
                assert(manager.profile.clear());
            });
        });
    });

    describe('#group',function(){
        it('should allow for DataHandler functions to be called directly for group',function(){
            assert(manager.group.insert);
            assert(manager.group.remove);
        });
    });

    describe('#account',function(){
        it('should allow for DataHandler functions to be called directly for account',function(){
            assert(manager.account.insert);
            assert(manager.account.remove);
        });
    });

    describe('#email',function(){
        it('should allow for DataHandler functions to be called directly for email',function(){
            assert(manager.email.insert);
            assert(manager.email.remove);
        });
    })
});
