const React = require('react');
const {ipcRenderer} = require('electron');

const Login = require('./components/Login.js');
const Home = require('./components/Home.js');

const App = React.createClass({
    getInitialState: function() {
        return {
            good_login: false
        }
    },
    setLogin: function(value) {
        console.log("value recieved for login:",value);
        this.setState({
            good_login: value
        });
    },
    render: function() {
        var child = this.state.good_login ? <Home loginState={this.setLogin} /> : <Login loginState={this.setLogin} />;
        return child;
    }
});

module.exports = App;
