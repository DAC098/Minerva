const React = require('react');
const {ipcRenderer} = require('electron');

const SideBar = require('../components/SideBar.js');
const ViewList = require('../components/ViewList.js');
const ViewAccount = require('../components/ViewAccount.js');
const Header = require('../components/Header.js');

const App = React.createClass({
    getInitialState: function() {
        return {
            tags: [],
            query: {},
            accounts: [],
            emails: [],
        }
    },
    componentDidMount: function() {
        ipcRenderer.on('find-accounts',(event,array) => this.findAccounts(array));
        ipcRenderer.on('find-emails',(event,array) => this.findEmails(array));
        ipcRenderer.on('find-tags',(event,array) => this.findTags(array));
    },
    findAccounts: function(variable) {
        if(Array.isArray(variable)) {
            this.setState({accounts: variable});
        } else {
            ipcRenderer.send('find-accounts',variable);
        }
    },
    findEmails: function(list) {
        if(Array.isArray(list)) {
            this.setState({emails: list});
        } else {
            ipcRenderer.send('find-emails');
        }
    },
    findTags: function(list) {
        if(Array.isArray(list)) {
            this.setState({tags: list});
        } else {
            ipcRenderer.send('find-tags');
        }
    },
    logout: function() {

    },


    render: function() {
        return (
            <section>
                <Header />
                <SideBar tags={this.state.tags} />
                <ViewList accounts={this.state.accounts} />
                <ViewAccount />
            </section>
        )
    }
});

module.exports = App;
