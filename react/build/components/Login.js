const React = require('react');
const {findDOMNode} = require('react-dom');
const {ipcRenderer} = require('electron');

const Login = React.createClass({
    getInitialState: function() {
        return {
            username: "",
            password: "",
        }
    },
    componentDidMount: function() {
        ipcRenderer.once("login-result",this.processLogin);
        ipcRenderer.once("create-account-result",this.processCreate);
    },
    disableEvent: function(event) {
        event.preventDefault();
    },
    updateInput: function(key,event) {
        const value = findDOMNode(event.target).value;
        var obj = {};
        obj[key] = this.state[key];
        obj[key] = value;
        this.setState(obj);
    },
    requestLogin: function(event) {
        console.log('user data:',this.state);
        ipcRenderer.send("login-request",this.state.username,this.state.password);
    },
    createAccount: function() {
        ipcRenderer.send("create-account",this.state.username,this.state.password);
    },
    processLogin: function(event,result) {
        if(result) {
            this.props.loginState(true);
        } else {
            console.log("invalid username or password");
        }
    },
    processCreate: function(event,result) {
        if(result) {
            this.props.loginState(true);
        } else {
            console.log("creation failed");
        }
    },
    render: function() {

        return (
            <section>
                <form onSubmit={this.disableEvent}>
                    <input onChange={this.updateInput.bind(this,'username')} type="text" placeholder="Username" value={this.state.username} />
                    <input onChange={this.updateInput.bind(this,'password')} type="password" placeholder="Password" value={this.state.password} />
                    <input onClick={this.requestLogin} type="button" value="Login" />
                    <input onClick={this.createAccount} type="button" value="Create" />
                </form>
            </section>
        )
    }
});

module.exports = Login;
