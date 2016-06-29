const React = require('react');
const { findDOMNode } = require('react-dom');
const { ipcRenderer } = require('electron');

const SideBar = React.createClass({
    displayName: 'SideBar',

    getInitialState: function () {
        return {
            new_group_name: "",
            groups: ipcRenderer.sendSync('load-groups', 'only-groups')
        };
    },
    componentDidMount: function () {
        ipcRenderer.on('new-group', this.setGroups);
    },
    componentWillUnmount: function () {
        ipcRenderer.removeListener('new-group', this.renderGroups);
    },
    updateGroupName: function (event) {
        this.setState({
            new_group_name: findDOMNode(event.target).value
        });
    },
    addGroup: function () {
        ipcRenderer.send('add-group', this.state.new_group_name);
    },
    setGroups: function (event, new_group) {
        console.log(`setting groups to ${ new_group }`);
        this.setState({
            groups: new_group
        });
    },
    requestGroup: function (group_name) {
        ipcRenderer.send('request-group', group_name);
    },
    renderGroups: function () {
        return this.state.groups.map(value => {

            return React.createElement(
                'div',
                { key: value, onClick: this.requestGroup.bind(this, value), __self: this,
                    __self: this
                },
                React.createElement(
                    'p',
                    {
                        __self: this,
                        __self: this
                    },
                    value
                )
            );
        });
    },
    render: function () {
        console.log('current groups:', this.state.groups);
        return React.createElement(
            'aside',
            { className: 'col-3', __self: this,
                __self: this
            },
            React.createElement(
                'div',
                { className: 'grid', __self: this,
                    __self: this
                },
                React.createElement(
                    'section',
                    { className: 'row', __self: this,
                        __self: this
                    },
                    React.createElement('input', { onChange: this.updateGroupName, type: 'text', placeholder: 'New Group', value: this.state.new_group_name, __self: this,
                        __self: this
                    }),
                    React.createElement('input', { onClick: this.addGroup, type: 'button', value: 'AddGroup', __self: this,
                        __self: this
                    })
                ),
                React.createElement(
                    'section',
                    { className: 'row', __self: this,
                        __self: this
                    },
                    React.createElement(
                        'div',
                        {
                            __self: this,
                            __self: this
                        },
                        React.createElement('input', { onClick: this.requestAll, type: 'button', value: 'all', __self: this,
                            __self: this
                        })
                    ),
                    this.renderGroups()
                )
            )
        );
    }
});

module.exports = SideBar;