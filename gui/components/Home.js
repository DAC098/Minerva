const React = require('react');
const { ipcRenderer } = require('electron');

const SideBar = require('./SideBar.js');
const AccountList = require('./AccountList.js');
const AccountMan = require('./AccountMan.js');

const Home = React.createClass({
    displayName: 'Home',

    getInitialState: function () {
        return {
            viewing_list: true,
            account_holder: {
                acc_name: "",
                username: "",
                password: "",
                fields: []
            }
        };
    },
    componentDidMount: function () {
        ipcRenderer.once('logout-successful', this.processLogout);
        ipcRenderer.on('view-list', this.viewAccountList);
    },
    saveProfile: function () {
        ipcRenderer.send('save-profile');
    },
    newAccount: function () {
        this.viewAccountMan({
            acc_name: "",
            username: "",
            password: "",
            email: "",
            fields: []
        });
    },
    viewAccountMan: function (account) {
        this.setState({
            viewing_list: false,
            account_holder: account
        });
    },
    viewAccountList: function () {
        this.setState({
            viewing_list: true,
            account_holder: {
                acc_name: "",
                username: "",
                password: "",
                email: "",
                fields: []
            }
        });
    },
    handleLogout: function () {
        ipcRenderer.send('logout-user');
    },
    processLogout: function () {
        this.props.loginState(false);
    },

    render: function () {
        console.log(`viewing_list: ${ this.state.viewing_list }`);
        return React.createElement(
            'div',
            {
                __self: this,
                __self: this
            },
            React.createElement(
                'header',
                { className: 'grid', __self: this,
                    __self: this
                },
                React.createElement('section', { className: 'col-4', __self: this,
                    __self: this
                }),
                React.createElement(
                    'section',
                    { className: 'col-4', __self: this,
                        __self: this
                    },
                    React.createElement(
                        'h4',
                        {
                            __self: this,
                            __self: this
                        },
                        'Minerva'
                    )
                ),
                React.createElement(
                    'section',
                    { className: 'col-4', __self: this,
                        __self: this
                    },
                    React.createElement('input', { onClick: this.newAccount, type: 'button', value: 'New Account', __self: this,
                        __self: this
                    }),
                    React.createElement('input', { onClick: this.saveProfile, type: 'button', value: 'Save', __self: this,
                        __self: this
                    }),
                    React.createElement('input', { onClick: this.handleLogout, type: 'button', value: 'Logout', __self: this,
                        __self: this
                    })
                )
            ),
            React.createElement(
                'main',
                { className: 'grid', __self: this,
                    __self: this
                },
                React.createElement(SideBar, {
                    __self: this,
                    __self: this
                }),
                React.createElement(
                    'section',
                    { className: 'col-9', __self: this,
                        __self: this
                    },
                    this.state.viewing_list ? React.createElement(AccountList, { viewAccount: this.viewAccountMan, __self: this,
                        __self: this
                    }) : React.createElement(AccountMan, { closeEditor: this.viewAccountList, new_account: this.state.account_holder.acc_name === "", account: this.state.account_holder, __self: this,
                        __self: this
                    })
                )
            )
        );
    }
});

module.exports = Home;