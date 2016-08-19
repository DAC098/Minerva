const React = require('react');
const {findDOMNode} = require('react-dom');
const {ipcRenderer} = require('electron');
const classnames = require('classnames');

const SideBar = React.createClass({
    getInitialState: function() {
        return {
            new_group_name: "",
            active_option: {
                add_group: false,
                edit_group: false
            }
        }
    },
    componentWillReceiveProps: function(new_props) {
        var {new_group_name,active_option} = this.state;
        if(new_props.command.success) {
            if(active_option.add_group || active_option.edit_group) {
                new_group_name = "";
                active_option.add_group = false;
                active_option.edit_group = false;
                this.setState({
                    new_group_name: new_group_name,
                    active_option: active_option
                });
            }
        }
    },
    updateGroupName: function(event) {
        this.setState({
            new_group_name: findDOMNode(event.target).value
        });
    },
    callParent: function(method_name,...args) {
        var {props} = this;
        if(method_name in props) {
            console.log(`calling method: ${method_name} with arguments:\n`,args);
            props[method_name].apply(null,args);
        }
    },
    setActiveOption: function(add,edit) {
        console.log('setting active option\nadd:',add,'\nedit:',edit);
        var {active_option} = this.state;
        active_option.add_group = add;
        active_option.edit_group = edit;
        this.setState({
            active_option: active_option,
            new_group_name: (edit) ? this.props.group.name : ""
        });
    },
    renderGroups: function() {
        return this.props.group_list.map((value) => {

            return (
                <input key={value.pk} onClick={this.callParent.bind(this,'requestGroup',value.pk)} type="button" value={value.name} />
            );
        });
    },
    render: function() {
        var disabled = !this.props.group.active;
        var dyn_btn_disabled = this.state.active_option.edit_group || this.state.active_option.add_group;
        var dyn_btn_name = "";
        var dyn_btn_func = undefined;
        if(this.state.active_option.edit_group){
            dyn_btn_name = "Update";
            dyn_btn_func = this.callParent.bind(this,'editGroup',this.state.new_group_name);
        }
        if(this.state.active_option.add_group){
            dyn_btn_name = "Create";
            dyn_btn_func = this.callParent.bind(this,'addGroup',this.state.new_group_name);
        }
        return (
            <aside className="col-3">
                <div className="grid">
                    <section className="row">
                        <input onClick={this.setActiveOption.bind(this,true,false)} type="button" value="Add" />
                        <input disabled={disabled} onClick={this.setActiveOption.bind(this,false,true)} type="button" value="Edit" />
                        <input disabled={disabled} onClick={this.callParent.bind(this,'removeGroup')} type="button" value="Delete" />
                        <input disabled={!dyn_btn_disabled} onChange={this.updateGroupName} type="text" placeholder="New Group" value={this.state.new_group_name} />
                        <input disabled={!dyn_btn_disabled} onClick={dyn_btn_func} type="button" value={dyn_btn_name} />
                    </section>
                    <section className="row">
                        <input onClick={this.callParent.bind(this,'requestAll')} type="button" value="all" />
                        {this.renderGroups()}
                    </section>
                </div>
            </aside>
        );
    }
});

module.exports = SideBar;
