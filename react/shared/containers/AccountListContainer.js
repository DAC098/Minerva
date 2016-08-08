const React = require('react');
const {ipcRenderer} = require('electron');

const AccountList = require('../components/AccountList.js');

const AccountListContainer = React.createClass({
    getInitialState: function() {
        return {
            list: [],
            group: "",
        }
    },
    componentDidMount: function() {
        ipcRenderer.on('group-accounts-found',this.setList);
        ipcRenderer.on('all-accounts-found',this.setList);
        ipcRenderer.on('account-list-updated',this.checkGroup);
    },
    componentWillUnmount: function() {
        ipcRenderer.removeListener('group-accounts-found',this.setList);
        ipcRenderer.removeListener('all-accounts-found',this.setList);
    },
    setList: function(event,new_list,group_pk) {
        this.setState({
            lise: new_list,
            group: (group_pk) ? group_pk : ""
        });
    },
    checkGroup: function(event,group_pk,removed) {
        if(group_pk === this.state.group) {
            if(removed) {
                ipcRenderer.send('request-accounts');
            } else {
                ipcRenderer.send('request-group',group_pk)
            }
        } else {
            ipcRenderer.send('request-accounts');
        }
    },

    viewAccount: function(pk) {
        ipcRenderer.send('get-account',pk);
        this.props.viewAccountMan(true,false,false);
    },
    editAccout: function(pk) {
        ipcRenderer.send('get-account',pk);
        this.props.viewAccountMan(true,false,true);
    },
    deleteAccout: function(pk) {

    },
    render: function() {
        console.log('sending list to component:',this.state.list);
        return <AccountList list={this.state.list} />
    }
});

module.exports = AccountListContainer;
