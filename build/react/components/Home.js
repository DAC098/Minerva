const React = require('react');
const {ipcRenderer} = require('electron');

const SideBar = require('./SideBar.js');

const Home = React.createClass({
    componentDidMount: function() {
        ipcRenderer.once('logout-successful',this.processLogout);
    },
    handleLogout: function() {
        ipcRenderer.send('logout-user');
    },
    processLogout: function() {
        this.props.loginState(false);
    },

    render: function() {

        return (
            <div>
                <header className="grid">
                    <section className="col-4">

                    </section>
                    <section className="col-4">
                        <h4>Minerva</h4>
                    </section>
                    <section className="col-4">
                        <input onClick={this.handleLogout} type="button" value="Logout" />
                    </section>
                </header>
                <main className="grid">
                    <SideBar />
                    <section className="col-9" />
                </main>
            </div>
        )
    }
});

module.exports = Home;
