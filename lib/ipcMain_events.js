const {ipcMain} = require('electron');

function IPCEvents(manager) {

    ipcMain.on("login-request",(event,user_name,user_password) => {
        console.log(`login request from user for ${user_name}`);
        var result = manager.loadProfile(user_name,user_password);
        event.sender.send('login-result',result);
    });

    ipcMain.on("create-account-request",(event,user_name,user_password) => {
        console.log(`creating account for ${user_name}`);
        var result = manager.createProfile(user_name,user_password);
        event.sender.send('create-account-result',result);
    });

    ipcMain.on("logout-user",(event) => {
        console.log("loging out current user");
        manager.saveProfile();
        if(manager.profileSaved()) {
            manager.clearCurrentProfile();
            event.sender.send('logout-successful');
        } else if(manager.profileSaving()) {
            manager.on('profile-saved',() => {
                manager.clearCurrentProfile();
                event.sender.send('logout-successful');
            });
        }
    });

    ipcMain.on('request-all',(event) => {
        event.returnValue = manager.getAccounts();
    });

    ipcMain.on("load-groups",(event,group_name) => {
        var rtn = manager.getGroup(group_name);
        event.returnValue = rtn;
    });

    ipcMain.on("add-group",(event,group_name)=>{
        manager.addGroup(group_name);
        event.sender.send('new-group',manager.getGroup('only-groups'));
    });

    ipcMain.on("add-account",(event,account) => {
        manager.addAccount(account.acc_name,account);
        event.sender.send('account-added');
    });

    ipcMain.on("update-account",(event,account) => {
        manager.updateAccoun(account.acc_name,account);
        event.sender.send('account-updated');
    });

    ipcMain.on("save-profile",(event) => {
        manager.saveProfile();
    });
}

module.exports = IPCEvents;
