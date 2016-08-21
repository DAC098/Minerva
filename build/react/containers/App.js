const React = require('react');
const {ipcRenderer} = require('electron');

const SideBar = require('../components/SideBar.js');
const ViewList = require('../components/ViewList.js');
const ViewAccount = require('../components/ViewAccount.js');
const Header = require('../components/Header.js');

const App = React.createClass({

    render: function() {
        return (
            <section>
                <Header />
                <SideBar />
                <ViewList />
                <ViewAccount />
            </section>
        )
    }
});

module.exports = App;
