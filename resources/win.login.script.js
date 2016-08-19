const React = require('react');
const {render} = require('react-dom');

const LoginCon = require('./reactjs/containers/LoginCon.js');

render(React.createElement(LoginCon),document.getElementById("render"));
