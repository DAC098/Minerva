const React = require('react');
const { findDOMNode } = require('react-dom');
const { ipcRenderer } = require('electron');

const AccountList = React.createClass({
    displayName: 'AccountList',

    getInitialState: function () {
        return {
            list: ipcRenderer.sendSync('request-all')
        };
    },
    componentDidMount: function () {
        ipcRenderer.on('list-update', this.setList);
    },
    componentWillUnmount: function () {
        ipcRenderer.removeAllListeners('list-update');
    },
    setList: function (event, new_list) {
        this.setState({
            list: new_list
        });
    },
    viewAccount: function (account) {
        this.props.viewAccount(account);
    },
    renderList: function () {
        return this.state.list.map(value => {

            return React.createElement(
                'div',
                { key: value.acc_name, className: 'row', onClick: this.viewAccount.bind(this, value), __self: this,
                    __self: this
                },
                React.createElement(
                    'h4',
                    {
                        __self: this,
                        __self: this
                    },
                    value.acc_name
                ),
                React.createElement(
                    'p',
                    {
                        __self: this,
                        __self: this
                    },
                    'email: ',
                    value.email,
                    ', username: ',
                    value.username
                )
            );
        });
    },
    render: function () {

        return React.createElement(
            'section',
            { className: 'grid', __self: this,
                __self: this
            },
            this.renderList()
        );
    }
});

module.exports = AccountList;