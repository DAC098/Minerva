const React = require('react');
const { findDOMNode } = require('react-dom');
const { ipcRenderer } = require('electron');

const Login = React.createClass({
    displayName: 'Login',

    getInitialState: function () {
        return {
            username: "",
            password: ""
        };
    },
    componentDidMount: function () {
        ipcRenderer.once("login-result", this.processLogin);
        ipcRenderer.once("create-account-result", this.processCreate);
    },
    disableEvent: function (event) {
        event.preventDefault();
    },
    updateUsername: function (event) {
        const value = findDOMNode(event.target).value;
        this.setState({
            username: value
        });
    },
    updatePassword: function (event) {
        const value = findDOMNode(event.target).value;
        this.setState({
            password: value
        });
    },
    requestLogin: function (event) {
        ipcRenderer.send("login-request", this.state.username, this.state.password);
    },
    createAccount: function () {
        ipcRenderer.send("create-account-request", this.state.username, this.state.password);
    },
    processLogin: function (event, result) {
        if (result) {
            this.props.loginState(true);
        } else {
            console.log("invalid username or password");
        }
    },
    processCreate: function (event, result) {
        if (result) {
            this.props.loginState(true);
        } else {
            console.log("creation failed");
        }
    },
    render: function () {

        return React.createElement(
            'section',
            {
                __self: this,
                __self: this
            },
            React.createElement(
                'form',
                { onSubmit: this.disableEvent, __self: this,
                    __self: this
                },
                React.createElement('input', { onChange: this.updateUsername, type: 'text', placeholder: 'Username', value: this.username, __self: this,
                    __self: this
                }),
                React.createElement('input', { onChange: this.updatePassword, type: 'password', placeholder: 'Password', value: this.password, __self: this,
                    __self: this
                }),
                React.createElement('input', { onClick: this.requestLogin, type: 'button', value: 'Login', __self: this,
                    __self: this
                }),
                React.createElement('input', { onClick: this.createAccount, type: 'button', value: 'Create', __self: this,
                    __self: this
                })
            )
        );
    }
});

module.exports = Login;