const React = require('react');
const {findDOMNode} = require('react-dom');
const {ipcRenderer} = require('electron');

const SideBar = React.createClass({
    getInitialState: function() {
        return {
            new_group_name: "",
            groups: ipcRenderer.sendSync('load-groups','only-groups'),
        }
    },
    componentDidMount: function() {
        ipcRenderer.on('new-group',this.setGroups);
    },
    componentWillUnmount: function() {
        ipcRenderer.removeListener('new-group',this.renderGroups);
    },
    updateGroupName: function(event) {
        this.setState({
            new_group_name: findDOMNode(event.target).value
        });
    },
    addGroup: function() {
        ipcRenderer.send('add-group',this.state.new_group_name);
    },
    setGroups: function(event,new_group) {
        console.log(`setting groups to ${new_group}`);
        this.setState({
            groups: new_group
        });
    },
    requestGroup:function(group_name) {
        ipcRenderer.send('request-group',group_name);
    },
    renderGroups: function() {
        return this.state.groups.map((value) => {

            return (
                <div key={value} onClick={this.requestGroup.bind(this,value)}>
                    <p>{value}</p>
                </div>
            );
        });
    },
    render: function() {
        console.log('current groups:',this.state.groups);
        return (
            <aside className="col-3">
                <div className="grid">
                    <section className="row">
                        <input onChange={this.updateGroupName} type="text" placeholder="New Group" value={this.state.new_group_name} />
                        <input onClick={this.addGroup} type="button" value="AddGroup" />
                    </section>
                    <section className="row">
                        <div>
                            <input onClick={this.requestAll} type="button" value="all" />
                        </div>
                        {this.renderGroups()}
                    </section>
                </div>
            </aside>
        );
    }
});

module.exports = SideBar;
