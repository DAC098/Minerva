const React = require('react');
const {ipcRenderer} = require('electron');

const GroupContainer = require('../containers/GroupContainer.js');
const AccountListContainer = require('../containers/AccountListContainer.js');

const SideBar = require('./SideBar.js');
const AccountList = require('./AccountList.js');
const AccountMan = require('./AccountMan.js');

const Home = React.createClass({
    getInitialState: function() {
        return {
            form_active: false,
            new_account: false,
            edit_account: false,
        }
    },
    componentDidMount: function() {
        ipcRenderer.once('logout-successful',this.processLogout);
    },
    saveProfile: function() {
        ipcRenderer.send('save-profile');
    },
    viewAccountMan: function(view_form,new_account,edit_account) {
        this.setState({
            form_active: view_form,
            new_account: new_account,
            edit_account: edit_account
        });
    },
    handleLogout: function() {
        ipcRenderer.send('logout-user');
    },
    processLogout: function() {
        this.props.loginState(false);
    },

    render: function() {
        console.log('home state:',this.state);
        return (
            <div>
                <header className="grid">
                    <section className="col-4">

                    </section>
                    <section className="col-4">
                        <h4>Minerva</h4>
                    </section>
                    <section className="col-4">
                        <input onClick={this.viewAccountMan.bind(this,true,true,true)} type="button" value="New Account" />
                        <input onClick={this.saveProfile} type="button" value="Save" />
                        <input onClick={this.handleLogout} type="button" value="Logout" />
                    </section>
                </header>
                <main className="grid">
                    <GroupContainer />
                    <section className="col-9">
                        <AccountListContainer viewAccountMan={this.viewAccountMan} />
                        <AccountMan viewAccountMan={this.viewAccountMan} active={this.state.form_active} new_account={this.state.new_account} editing={this.state.edit_account} />
                    </section>
                </main>
            </div>
        )
    }
});

module.exports = Home;
