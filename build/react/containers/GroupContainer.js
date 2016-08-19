var React = require('react');
var {ipcRenderer} = require('electron');

var SideBar = require('../components/SideBar.js');

const GroupContainer = React.createClass({
    getInitialState: function() {
        return {
            group: {
                active: false,
                pk: 0
            },
            group_list: [],
            command:{
                sent: false,
                success: false
            }
        };
    },
    componentDidMount: function() {
        ipcRenderer.on('groups-found',this.setGroup);
        ipcRenderer.on('groups-updated',this.checkGroup);

        ipcRenderer.send('get-groups');
    },
    componentWillUnmount: function() {
        ipcRenderer.removeListener('groups-found',this.setGroup);
        ipcRenderer.removeListener('groups-updated',this.checkGroup);
    },

    setCommand: function(sent,success) {
        this.setState({
            command: {
                sent: sent,
                success: success,
            }
        });
    },
    setGroup: function(event,group_list,group_pk = "") {
        console.log('----------setGroup start----------');
        console.log('setting group data:\npk:',group_pk,"\nlist:",group_list,"\ngroup active:",group_pk !== "");
        var list = (group_list) ? group_list : this.state.group_list;
        var find_pk = (group_pk) ? group_pk : this.state.group.pk;
        var group = list.find((element,index,array) => {
            return element.pk === find_pk;
        });
        console.log('group found from list:',group);
        this.setState({
            group: {
                active: typeof group !== "undefined",
                pk: (group) ? group.pk : "",
                name: (group) ? group.name : ""
            },
            group_list: (group_list) ? group_list : this.state.group_list
        });
        console.log('----------setGroup end----------');
    },

    requestAll: function() {
        console.log('----------requestAll start----------');
        ipcRenderer.send('request-accounts');
        this.setGroup();
        console.log('----------requestAll end----------');
    },
    requestGroup: function(group_pk) {
        console.log('----------requestGroup start----------');
        ipcRenderer.send('request-group',group_pk)
        this.setGroup(null,null,group_pk);
        this.setState({
            command: {
                sent: true,
                success: false
            }
        });
        console.log('----------requestGroup end----------');
    },

    checkGroup: function(event,new_list) {
        console.log('----------checkGroup start----------');
        console.log('checking new list');
        var {group,group_list} = this.state;
        console.log(`current group data:
    group:`,group,`
    list:`,group_list);
        if(group.active) {
            console.log('group is active, checking if still exists');
            var found_group = new_list.find((element,index,array) => {
                return element.pk === group.pk;
            });
            if(found_group) {
                console.log('group exists');
                this.setGroup(null,new_list,group.pk);
            } else {
                console.log('group does not exists');
                this.setGroup(null,new_list);
                this.requestAll();
            }
        } else {
            console.log('no group is active');
            this.setGroup(null,new_list);
        }
        this.setCommand(false,true);
        console.log('----------checkGroup end----------');
    },

    addGroup: function(group_name) {
        ipcRenderer.send('add-group',group_name);
        this.setCommand(true,false);
    },
    editGroup: function(group_name) {

        ipcRenderer.send('edit-group',this.state.group.pk,group_name);
        this.setCommand(true,false);
    },
    removeGroup: function() {
        ipcRenderer.send('remove-group',this.state.group.pk);
        this.setCommand(true,false);
    },

    render: function() {
        return <SideBar group_list={this.state.group_list} group={this.state.group} command={this.state.command}
                    requestAll={this.requestAll} requestGroup={this.requestGroup}
                    addGroup={this.addGroup} removeGroup={this.removeGroup} editGroup={this.editGroup}
                />
    }
});

module.exports = GroupContainer;
