const {ipcMain} = require('electron');

function IPCEvents(manager,webContents) {

    const {signal} = manager;

    function sendEmailList() {

        webContents.send('new-email-list',manager.getEmails());

    }

    function sendAccountList(account_pk) {

        webContents.send('account-list-updated',account_pk);

    }

    function sendGroupList(group_pk) {

        webContents.send('groups-updated',manager.getGroups(),group_pk);

    }

    // manager emitters

    manager.on(signal.group.updated,(group_pk) => {

        webContents.send('group-list-updated',group_pk);

    });

    manager.on(signal.group.added,sendGroupList);

    manager.on(signal.group.edited,sendGroupList);

    manager.on(signal.group.removed,sendGroupList);

    manager.on(signal.email.added,sendEmailList);

    manager.on(signal.email.removed,sendEmailList);

    manager.on(signal.account.added,sendAccountList);

    manager.on(signal.account.removed,sendAccountList);

    manager.on(signal.account.updated,sendAccountList);

    manager.on(signal.profile.updated,() => {

        webContents.send('profile-updated');

    });

    // manager events

    ipcMain.on("login-request",(event,user_name,user_password) => {

        console.log(`\nlogin request from user for ${user_name}`);

        var result = manager.loadProfile(user_name,user_password);
        event.sender.send('login-result',result);

    });

    ipcMain.on("create-account",(event,user_name,user_password) => {

        console.log(`\ncreating account for ${user_name}`);

        var result = manager.createProfile(user_name,user_password);
        event.sender.send('create-account-result',result);

    });

    ipcMain.on("logout-user",(event) => {

        console.log("loging out current user");

        manager.saveProfile();

        manager.once(signal.profile.saved,() => {

            manager.clearCurrentProfile();
            event.sender.send('logout-successful');

        });

    });

    // group events

    ipcMain.on("request-group",(event,group_pk) => {

        event.sender.send('group-accounts-found',manager.getGroupAccounts(),group_pk);

    });

    ipcMain.on('get-groups',(event) => {

        event.sender.send('groups-found',manager.getGroups());

    });

    ipcMain.on("add-group",(event,group_name)=>{

        manager.addGroup(group_name);

    });

    ipcMain.on('update-group',(event,group_name,account_pk,remove) => {

        if(remove) {

            manager.removeFromGroup(group_name,account_pk,true);

        } else {

            manager.addToGroup(group_name,account_pk,true);

        }

    });

    ipcMain.on('edit-group',(event,group_pk,new_name) => {

        manager.editGroup(group_pk,new_name);

    });

    ipcMain.on('remove-group',(event,group_pk) => {

        manager.removeGroup(group_pk);

    });

    // account events

    ipcMain.on('request-accounts',(event) => {

        event.sender.send('all-accounts-found',manager.getAccounts());

    });

    ipcMain.on('get-account',(event,account_pk) => {

        event.sender.send('found-account',manager.findAccount(account_pk));

    });

    ipcMain.on("add-account",(event,account) => {

        manager.addAccount(account);

    });

    ipcMain.on("update-account",(event,account) => {

        manager.updateAccount(account.pk,account);

    });

    ipcMain.on('remove-account',(event,account_pk) => {

        manager.deleteAccount(account_pk);

    });

    // profile events

    ipcMain.on("save-profile",(event) => {

        manager.saveProfile();

    });
}

module.exports = IPCEvents;
