const React = require('react');
const {ipcRenderer} = require('electron');

const LoginComp = require('../components/LoginComp.js');

const LoginCon = React.createClass({
    getInitialState: function() {
        return {
            failed: {
                login: false,
                create: false
            }
        }
    },
    componentDidMount: function() {
        ipcRenderer.on('login-invalid',() => this.failed('login'));
        ipcRenderer.on('login-not-created',() => this.failed('create'));
    },
    componentWilUnmount: function() {
        ipcRenderer.removeAllListeners('login-invalid');
        ipcRenderer.removeAllListeners('login-not-created');
    },
    failed: function(method) {
        let {failed} = this.state;
        failed[method] = true;
        this.setState({failed});
    },
    login: function(username,password) {
        let {failed} = this.state;
        failed.login = false;
        ipcRenderer.send('login',username,password);
        this.setState({failed});
    },
    create: function(username,password) {
        let {failed} = this.state;
        failed.create = false;
        ipcRenderer.send('create',username,password);
        this.setState({failed});
    },
    render: function() {
        return <LoginComp login={this.login} create={this.create} failed={this.state.failed}/>
    }
});

module.exports = LoginCon;
