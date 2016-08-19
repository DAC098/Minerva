const React = require('react');
const {render} = require('react-dom');

const App = require('./reactjs/App.js');

render(React.createElement(App),document.getElementById("render"));
