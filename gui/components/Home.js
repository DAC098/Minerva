const React = require('react');
const { ipcRenderer } = require('electron');

const SideBar = require('./SideBar.js');

const Home = React.createClass({
    displayName: 'Home',

    componentDidMount: function () {
        ipcRenderer.once('logout-successful', this.processLogout);
    },
    handleLogout: function () {
        ipcRenderer.send('logout-user');
    },
    processLogout: function () {
        this.props.loginState(false);
    },

    render: function () {

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
                React.createElement('section', { className: 'col-9', __self: this,
                    __self: this
                })
            )
        );
    }
});

module.exports = Home;