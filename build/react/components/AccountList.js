const React = require('react');
const {findDOMNode} = require('react-dom');
const {ipcRenderer} = require('electron');

const AccountList = React.createClass({
    getInitialState: function() {
        return {
            list: ipcRenderer.sendSync('request-all'),
        }
    },
    componentDidMount:function() {
        ipcRenderer.on('list-update',this.setList);
    },
    componentWillUnmount: function() {
        ipcRenderer.removeAllListeners('list-update');
    },
    setList: function(event,new_list) {
        this.setState({
            list: new_list
        });
    },
    viewAccount: function(account) {
        this.props.viewAccount(account)
    },
    renderList: function() {
        return this.state.list.map((value) => {

            return (
                <div key={value.acc_name} className="row" onClick={this.viewAccount.bind(this,value)}>
                    <h4>{value.acc_name}</h4>
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
