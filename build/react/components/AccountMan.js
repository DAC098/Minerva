const React = require('react');
const {findDOMNode} = require('react-dom');
const {ipcRenderer} = require('electron');

const AccountMan = React.createClass({
    getInitialState: function() {
        const {account} = this.props;
        return {
            new_field: "",
            new_field_type: "text",
            account: account,
            account_saved: true,
        };
    },
    componentDidMount: function() {
        ipcRenderer.on("account-added",this.addResult);
        ipcRenderer.on("account-updated",this.updateResult);
    },
    disableEvent: function(event) {
        event.preventDefault();
    },
    closeEdit: function() {
        this.props.closeEditor();
    },
    addResult: function(event) {
        var tmp_obj = {
            acc_name: "",
            usename: "",
            password: "",
            email: "",
            fields: [],
        }
        this.setState({
            account: tmp_obj,
            new_field: "",
            new_field_type: "text",
            account_saved: true,
        });
    },
    updateAccountName: function(event) {
        var value = findDOMNode(event.target).value;
        var acc = this.state.account;
        acc.acc_name = value;
        this.setState({
            account: acc,
            account_saved: false,
        });
    },
    updateUsername: function(event) {
        var value = findDOMNode(event.target).value;
        var acc = this.state.account;
        acc.username = value;
        this.setState({
            account: acc,
            account_saved: false,
        });
    },
    updatePassword: function(event) {
        var value = findDOMNode(event.target).value;
        var acc = this.state.account;
        acc.password = value;
        this.setState({
            account: acc,
            account_saved: false,
        });
    },
    updateNewField: function(event) {
        this.setState({
            new_field: findDOMNode(event.target).value,
        });
    },
    updateNewFieldType: function(event) {
        this.setState({
            new_field_type: findDOMNode(event.target).value,
        });
    },
    addNewField: function(event) {
        var acc = this.state.account;
        var new_field_data = undefined;
        switch (this.state.new_field_type) {
            case "text":
            case "password":
                new_field_data = "";
                break;
            case "number":
                new_field_data = 0;
        }
        acc.fields.push({
            field_name: this.state.new_field,
            field_type: this.state.new_field_type,
            field_data: new_field_data,
        });
        this.setState({
            account: acc,
            new_field: "",
            new_field_type: "text",
            account_saved: false,
        });
    },
    updateFieldName: function(field_index,event) {
        var value = findDOMNode(event.target).value;
        var acc = this.state.account;
        acc.fields[field_index].field_name = value;
        this.setState({
            account: acc,
            account_saved: false,
        });
    },
    updateFieldType: function(field_index,event) {
        var value = findDOMNode(event.target).value;
        var acc = this.state.account;
        var current_type = acc.fields[field_index].field_type;
        acc.fields[field_index].field_type = value;
        if(value === "number" && current_type !== value) {
            acc.fields[field_index].field_data = 0;
        }
        this.setState({
            account: acc,
            account_saved: false,
        });
    },
    updateFieldData: function(field_index,event) {
        var value = findDOMNode(event.target).value;
        var acc = this.state.account;
        acc.fields[field_index].field_data = value;
        console.log(`field updated:`,acc.fields[field_index]);
        this.setState({
            account: acc,
            account_saved: false,
        });
    },
    addAccount: function() {
        var {account} = this.state;
        if(account.acc_name !== "") {
            ipcRenderer.send("add-account",account);
        }
    },
    addResult: function() {
        console.log("added account to profile");
        this.setState({
            account_saved: true,
        });
    },
    updateAccount: function() {
        var {account} = this.state;
        if(account.acc_name !== "") {
            ipcRenderer.send('update-account',account);
        }
    },
    updateResult: function() {
        console.log("updated account in profile");
        this.setState({
            account_saved: true,
        });
    },
    renderFields: function() {
        return this.state.account.fields.map((value,index) => {
            return (
                <div key={index} className="row">
                    <input onChange={this.updateFieldName.bind(this,index)} type="text" value={value.field_name} />
                    <select onChange={this.updateFieldType.bind(this,index)} value={value.field_type}>
                        <option value="text">Text</option>
                        <option value="password">Important</option>
                        <option value="number">Number</option>
                    </select>
                    <input onChange={this.updateFieldData.bind(this,index)} type={value.field_type} value={value.field_data} />
                </div>
            )
        });
    },
    renderEmails: function() {
    },
    render: function() {
        var disabled = !this.props.new_account;
        return (
            <form onSubmit={this.disableEvent}>
                <input onClick={this.closeEdit} type="button" value="Close" />
                <label>Account Name</label>
                <input disabled={disabled} onChange={this.updateAccountName} type="text" value={this.state.account.acc_name} />
                <label>Username</label>
                <input onChange={this.updateUsername} type="text" value={this.state.account.username} />
                <label>Password</label>
                <input onChange={this.updatePassword} type="password" value={this.state.account.password} />
                <label>Email</label>
                <input onChange={this.updateEmail} type="text" value={this.state.account.email} />
                <select onChange={this.updateEmailViaRef} value={this.state.account.email}>

                </select>
                <div>
                    {this.props.new_account ?
                        <input onClick={this.addAccount} type="button" value="Add" />
                        :
                        <input onClick={this.updateAccount} type="button" value="Update" />
                    }
                </div>
                <div className="grid">
                    <h4 className="row">New Field</h4>
                    <section className="row">
                        <input onChange={this.updateNewField} type="text" value={this.state.new_field} />
                        <select onChange={this.updateNewFieldType} value={this.state.new_field_type}>
                            <option value="text">Text</option>
                            <option value="password">Important</option>
                            <option value="number">Number</option>
                        </select>
                        <input onClick={this.addNewField} type="button" value="Add Field" />
                    </section>
                    <h4 className="row">Fields</h4>
                    <div className="row">
                        <section className="grid">
                            {this.renderFields()}
                        </section>
                    </div>
                </div>
            </form>
        )
    }
});

module.exports = AccountMan;
