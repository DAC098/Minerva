const events = require('events');
const util = require('util');
require('../ProtoExtend.js');

const cloneObj = (obj) => {
    var rtn = {};
    for(const key in obj) {
        if(typeof obj[key] === "object" && !Array.isArray(obj[key]) && (Object.keys(obj[key])).length !== 0) {
            rtn[key] = cloneObj(obj[key]);
        } else {
            var variable = obj[key];
            rtn[key] = variable;
        }
    }
    return rtn;
}

const DataHandler = function DataHandler(debug) {

    events.call(this);
    DataHandler.prototype.__proto__ = events.prototype;

    const self = this;

    const str_compare_options = {
        usage: 'sort',
        sensitivity: 'base',
    };

    const data_template = {
        _pk: {
            account: "1",
            group: "1",
        },
        _emails: [],
        _groups: [],
        _accounts: {}
    };

    const account_tmplt = {
        name: "",
        username: "",
        password: "",
        is_email: false,
        email: "",
        fields: [],
    }

    const parse_value = 36;

    var current_data = cloneObj(data_template);

    function logger(...args) {
        args.unshift("[DataHandler] ");
        if(debug) {
            console.log.apply(null,args);
        }
    }

    const setPK = (pk_key) => {
        try {
            var curr_val = parseInt(current_data._pk[pk_key],parse_value) + 1;
            current_data._pk[pk_key] = curr_val.toString(parse_value);
        } catch(err) {
            logger(`invalid pk key: ${pk_key}`);
        }
    }

    const compareTypes = (value_one,value_two) => {
        return typeof value_one === typeof value_two && Array.isArray(value_one) === Array.isArray(value_two);
    }

    const checkObject = (check_obj,against_obj) => {
        var result = {
            valid: true,
            keys: []
        };
        for(const key in check_obj) {
            if(!key in against_obj) {
                result.valid = false;
                result.keys.push(key);
            }
            if(!compareTypes(check_obj[key],against_obj[key])) {
                result.valid = false;
                result.keys.push(key);
            }
        }
        return result;
    }

    const fillMissingKeys = (check_obj,template_obj) => {
        logger(`filling object: ${util.inspect(check_obj,{depth:null})} to match: ${util.inspect(template_obj,{depth:null})}`);
        for(const key in template_obj) {
            if(!(key in check_obj)) {
                logger(`adding key: ${key} to object`);
                check_obj[key] = template_obj[key];
            }
        }
    }

    const dispatch = (ref,type,data) => {
        self.emit('event',ref,type,data);
    }

    this.initPKs = () => {
        var num = 1;
        current_data._pk['account'] = num.toString(parse_value);
        current_data._pk['group'] = num.toString(parse_value);
    }

    this.getNextPK = (pk_request) => {
        var result = current_data._pk[pk_request];
        if(result) {
            logger(`returning next pk for ${pk_request}`);
        } else {
            logger(`${pk_request} is undefined`);
        }
        return result;
    }

    this.data = {
        set: (new_data) => {
            current_data = new_data;
            logger('new account data has been set');
            return true;
        },
        get: () => {
            logger(`sending current data`);
            return current_data;
        },
        clear: () => {
            current_data = cloneObj(data_template);
            logger('data has been cleared');
            return true;
        }
    }

    this.group = {
        /**
         * insert
         *
         * creates a template for the group, sets it with the next pk and given
         *
         * name and pushes it to current_data
         * @param: group_name [string], the name of the new group
         * @return: the pk given to the new group, or undefined if error
         */
        insert: (group_name) => {
            logger(`inserting new group: ${group_name}`);
            var temp = {
                pk: current_data._pk.group,
                name: group_name,
                ref: []
            };
            var result = false;
            var len = current_data._groups.length;

            if(len === 0) {
                current_data._groups.push(temp);
                setPK('group');
                logger(`group: ${group_name} added`);
                dispatch('group','insert',temp.pk);
                return temp.pk
            }

            for(const index of current_data._groups) {
                if(index.name.localeCompare(group_name,str_compare_options) === 0) {
                    logger(`${group_name} already exists`)
                    return index.pk;
                }
            }

            result = current_data._groups.insert(temp,(element) => {
                return element.name.localeCompare(group_name,str_compare_options) > 0;
            });

            if(result) {
                setPK('group');
                logger(`group: ${group_name} added`);
                dispatch('group','insert',temp.pk);
                return temp.pk;
            }

            return undefined;
        },
        /**
         * update
         *
         * updates the desired group with the new name given
         *
         * @param: pk [string], the pk value of the group to change
         * @param: new_name [string], the new name of the group
         * @return: the pk value of the the updated group, or undefined if error
         * or unable to find group
         */
        update: (pk,new_name) => {
            var index = current_data._groups.find((element) => {
                return parseInt(pk,parse_value) === parseInt(element.pk,parse_value);
            });
            if(index) {
                index.name = new_name;
                logger(`group: ${index.pk} updated with new name: ${new_name}`);
                dispatch('group','update',index.pk);
                return index.pk;
            } else {
                logger(`unable to find group: ${pk}, update failed`);
                return undefined;
            }
            logger(`unable to find group: ${pk}, update failed`);
        },
        /**
         * remove
         *
         * removes the desired group based on the given pk
         *
         * @param: pk [string], the pk value of the group to remove
         * @return: [string/undefined], the pk value of the group removed or
         * undefined if error or was unable to find group
         */
        remove: (pk) => {
            var index = current_data._groups.findIndex((element) => {
                return parseInt(pk,parse_value) === parseInt(element.pk,parse_value);
            });
            if(index >= 0) {
                if(current_data._groups.remove(index)) {
                    logger(`removed group: ${pk}`);
                    dispatch('group','remove',pk);
                    return pk;
                } else {
                    logger(`unable to remove group: ${pk}, remove failed`);
                    return undefined;
                }
            }
            logger(`did not find group: ${pk}, remove failed`)
        },
        /**
         * find
         *
         * will find a desired group with accounts or will send a list of all
         * groups without any account data
         *
         * @param: pk [string], the pk value of the group to find
         * @return: [array/undefined], the list of all current groups or a
         * single list item with the desired group
         */
        find: (pk) => {
            var rtn = [];
            if(pk) {
                var index = current_data._groups.find((element) => {
                    return parseInt(pk,parse_value) === parseInt(element.pk,parse_value);
                });

                if(index) {
                    var list = [];
                    for(const element of index.ref) {
                        list.push(self.account.find(element));
                    }
                    rtn.push(cloneObj(index));
                    rtn[0].ref = list;
                    logger(`returning data for group: ${pk}`);
                    return rtn;
                } else {
                    logger(`unable to find group: ${pk}, find failed`);
                    return undefined;
                }
            } else {
                rtn = current_data._groups.map((element) => {
                    var tmp = cloneObj(element);
                    delete tmp.ref;
                    return tmp;
                });

                rtn = rtn.sort((a,b) => {
                    return a.name.localeCompare(b.name,str_compare_options);
                });

                return rtn;
            }
        },
        addTo: (group_pk,account_pk) => {
            if(account_pk in current_data._accounts) {
                var desired_group = current_data._groups.find((element) => {
                    return parseInt(group_pk,parse_value) === parseInt(element.pk,parse_value);
                });
                if(desired_group) {
                    var result = desired_group.ref.insert(account_pk,(element) => {
                        return parseInt(account_pk,parse_value) > parseInt(element,parse_value);
                    });
                    if(result) {
                        logger(`account: ${account_pk} added to group: ${group_pk}, addTo failed`);
                        dispatch('group','addTo',group_pk);
                        return group_pk;
                    } else {
                        logger(`unable to add account: ${account_pk} to group: ${group_pk}, addTo failed`);
                        return undefined;
                    }
                } else {
                    logger(`unable to find group: ${group_pk}, addTo failed`);
                    return undefined;
                }
            } else {
                logger(`account: ${account_pk} does not exists, addTo failed`);
                return undefined;
            }
        },
        removeFrom: (group_pk,account_pk) => {
            if(account_pk in current_data._accounts) {
                var desired_group = current_data._groups.find((element) => {
                    return parseInt(group_pk,parse_value) === parseInt(element.pk,parse_value);
                });
                if(desired_group) {
                    var result = desired_group.ref.remove(account_pk,(element) => {
                        return parseInt(account_pk,parse_value) > parseInt(element,parse_value);
                    });
                    if(result) {
                        logger(`account: ${account_pk} removed from group: ${group_pk}, removeFrom failed`);
                        dispatch('group','removeFrom',group_pk);
                        return group_pk;
                    } else {
                        logger(`unable to remove account: ${account_pk} from group: ${group_pk}, removeFrom failed`);
                        return undefined;
                    }
                } else {
                    logger(`unable to find group: ${group_pk}, removeFrom failed`);
                    return undefined;
                }
            } else {
                logger(`account: ${account_pk} does not exists, removeFrom failed`);
                return undefined;
            }
        }
    }

    this.account = {
        insert: (account_data,group_pk) => {
            var new_pk = current_data._pk.account;
            var found = checkObject(account_data,account_tmplt);
            account_data['pk'] = new_pk;
            logger(`inserting new account: ${new_pk} data:\n${util.inspect(account_data,{depth:null})}`);
            if(found.valid) {
                logger(`data is valid continuing insert`);
                fillMissingKeys(account_data,account_tmplt);
                if(account_data.is_email) {
                    self.email.insert(new_pk);
                }
                if(group_pk) {
                    self.group.addTo(group_pk,new_pk);
                }
                current_data._accounts[new_pk] = account_data;
                setPK('account');
                logger(`account: ${new_pk} added`);
                dispatch('account','insert',new_pk);
                return new_pk;
            } else {
                logger(`unexpected key value pairs: ${found.keys}, insert failed`);
                return undefined;
            }
        },
        update: (account_pk,new_data,group_pk) => {
            var exists = account_pk in current_data._accounts;
            var found = checkObject(new_data,account_tmplt);
            if(found.valid && exists) {
                var current_account = current_data._accounts[account_pk];
                if(current_account.in_group) {
                    self.group.removeFrom(current_account.in_group,account_pk);
                }
                if(group_pk) {
                    self.group.addTo(group_pk,account_pk);
                }
                if(new_data) {
                    if(!new_data.is_email && current_account.is_email) {
                        self.email.remove(account_pk);
                    }
                    if(new_data.is_email && !current_account.is_email) {
                        self.email.insert(account_pk);
                    }
                }
                logger(`account: ${account_pk} updated`);
                dispatch('account','update',account_pk);
                return account_pk;
            } else {
                var str = "";
                str += (!valid) ? `unexpected key value pairs ${found.keys}` : '';
                str += (!exists) ? `account: ${account_pk} does not exists` : '';
                str += "account update faield";
                logger(str);
            }
        },
        remove: (account_pk) => {
            if(account_pk in current_data._accounts) {
                if(current_data._accounts[account_pk].is_email) {
                    current_data._emails.remove((element) => {
                        return parseInt(element,parse_value) === parseInt(account_pk,parse_value);
                    });
                }
                if(current_data._accounts[account_pk].in_group) {
                    self.group.removeFrom(current_data._accounts[account_pk].in_group,account_pk);
                }
                delete current_data._accounts[account_pk];
                logger(`account: ${account_pk} removed`);
                dispatch('account','remove',account_pk);
                return account_pk;
            } else {
                logger(`account: ${account_pk} does not exist, remove failed`);
                return undefined;
            }
        },
        find: (account_pk) => {
            if(account_pk && exists) {
                if(account_pk in current_data._accounts) {
                    return cloneObj(current_data._accounts[account_pk]);
                } else {
                    logger(`account: ${account_pk} does not exist, find failed`);
                    return undefined;
                }
            } else {
                var rtn = [];
                for(const key in current_data._accounts) {
                    rtn.push(cloneObj(current_data._accounts[key]));
                }
                return rtn;
            }
        }
    }

    this.email = {
        insert: (account_pk) => {
            var result = current_data._emails.insert(account_pk,(element) => {
                return parseInt(account_pk,parse_value) > parseInt(element,parse_value);
            });
            if(result) {
                logger(`account: ${account_pk} added to email list`);
                dispatch('email','insert',account_pk);
            }
            return result;
        },
        remove: (account_pk) => {
            var result = current_data._emails.remove((element) => {
                return parseInt(account_pk,parse_value) === parseInt(element,parse_value);
            });
            if(result) {
                logger(`account: ${account_pk} removed from email list`);
                dispatch('email','remove',account_pk);
            }
            return result;
        },
        find: () => {
            var rtn = current_data._emails;
            rtn = rtn.sort((a,b) => {
                return a.name.localeCompare(b.name,str_compare_options);
            });
            return rtn;
        }
    }
}

module.exports = DataHandler;
