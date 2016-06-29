const React = require('react');
const { ipcRenderer } = require('electron');

const Login = require('./components/Login.js');
const Home = require('./components/Home.js');

const App = React.createClass({
    displayName: 'App',

    getInitialState: function () {
        return {
            good_login: false
        };
    },
    setLogin: function (value) {
        console.log("value recieved for login:", value);
        this.setState({
            good_login: value
        });
    },
    render: function () {
        var child = this.state.good_login ? React.createElement(Home, { loginState: this.setLogin, __self: this,
            __self: this
        }) : React.createElement(Login, { loginState: this.setLogin, __self: this,
            __self: this
        });
        return child;
    }
});

module.exports = App;