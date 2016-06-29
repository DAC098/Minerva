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
    updateUsername: function(event) {
        const value = findDOMNode(event.target).value;
        this.setState({
            username: value
        });
    },
    updatePassword: function(event) {
        const value= findDOMNode(event.target).value;
        this.setState({
            password: value
        });
    },
    requestLogin: function(event) {
        ipcRenderer.send("login-request",this.state.username,this.state.password);
    },
    createAccount: function() {
        ipcRenderer.send("create-account-request",this.state.username,this.state.password);
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
                    <input onChange={this.updateUsername} type="text" placeholder="Username" value={this.username} />
                    <input onChange={this.updatePassword} type="password" placeholder="Password" value={this.password} />
                    <input onClick={this.requestLogin} type="button" value="Login" />
                    <input onClick={this.createAccount} type="button" value="Create" />
                </form>
            </section>
        )
    }
});

module.exports = Login;
