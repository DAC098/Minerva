const React = require('react');
const {ipcRenderer} = require('electron');

const SideBar = require('./SideBar.js');
const AccountList = require('./AccountList.js');
const AccountMan = require('./AccountMan.js');

const Home = React.createClass({
    getInitialState: function() {
        return {
            viewing_list: true,
            account_holder: {
                acc_name: "",
                username: "",
                password: "",
                fields: [],
            },
        }
    },
    componentDidMount: function() {
        ipcRenderer.once('logout-successful',this.processLogout);
        ipcRenderer.on('view-list',this.viewAccountList);
    },
    saveProfile: function() {
        ipcRenderer.send('save-profile');
    },
    newAccount: function() {
        this.viewAccountMan({
            acc_name: "",
            username: "",
            password: "",
            email: "",
            fields: [],
        });
    },
    viewAccountMan: function(account) {
        this.setState({
            viewing_list: false,
            account_holder: account
        });
    },
    viewAccountList: function() {
        this.setState({
            viewing_list: true,
            account_holder: {
                acc_name: "",
                username: "",
                password: "",
                email: "",
                fields: [],
            }
        });
    },
    handleLogout: function() {
        ipcRenderer.send('logout-user');
    },
    processLogout: function() {
        this.props.loginState(false);
    },

    render: function() {
        console.log(`viewing_list: ${this.state.viewing_list}`);
        return (
            <div>
                <header className="grid">
                    <section className="col-4">

                    </section>
                    <section className="col-4">
                        <h4>Minerva</h4>
                    </section>
                    <section className="col-4">
                        <input onClick={this.newAccount} type="button" value="New Account" />
                        <input onClick={this.saveProfile} type="button" value="Save" />
                        <input onClick={this.handleLogout} type="button" value="Logout" />
                    </section>
                </header>
                <main className="grid">
                    <SideBar />
                    <section className="col-9">
                        { this.state.viewing_list ? <AccountList viewAccount={this.viewAccountMan} /> : <AccountMan closeEditor={this.viewAccountList} new_account={this.state.account_holder.acc_name === ""} account={this.state.account_holder} />}
                    </section>
                </main>
            </div>
        )
    }
});

module.exports = Home;
