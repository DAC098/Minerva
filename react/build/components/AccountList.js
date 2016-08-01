const React = require('react');
const {findDOMNode} = require('react-dom');
const {ipcRenderer} = require('electron');
//ipcRenderer.sendSync('request-account-all')
const AccountList = React.createClass({
    getInitialState: function() {
        return {
            list: [],
            active_element: "",
            element: {
                active: false,
                pk: ""
            }
        }
    },
    componentDidMount:function() {
        ipcRenderer.on('group-request',this.setList);
        ipcRenderer.on('accounts-request',this.setList);
    },
    componentWillUnmount: function() {
        ipcRenderer.removeListener('group-request',this.setList);
        ipcRenderer.removeListener('accounts-request',this.setList);
    },
    setList: function(event,new_list) {
        this.setState({
            list: new_list
        });
    },
    setActive: function(pk,event) {
        var {element} = this.state;
        if(pk === element.pk) {
            element.active = false;
            element.pk = "";
        } else {
            element.active = true;
            element.pk = pk;
        }
        this.setState({
            element: element
        });
    },
    viewAccount: function(pk,view_form,new_account,edit_account) {
        ipcRenderer.send('get-account',pk);
        this.props.viewAccountMan(view_form,new_account,edit_account);
    },
    editAccout: function() {
        ipcRenderer.send('get-account',this.state.element.pk)
        this.props.viewAccountMan(true,false,true);
    },
    renderList: function() {
        return this.state.list.map((value) => {

            return (
                <div key={value.pk} className="row" onClick={this.setActive.bind(this,value.pk)} onDoubleClick={this.viewAccount.bind(this,value.pk,true,false,false)}>
                    <h4>{value.name}</h4>
                    <p>email: {value.email}, username: {value.username}</p>
                </div>
            )
        });
    },
    render: function() {
        return (
            <section className="grid">
                {this.renderList()}
            </section>
        );
    }
});

module.exports = AccountList;
