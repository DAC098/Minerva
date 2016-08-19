const React = require('react');
const {findDOMNode} = require('react-dom');
const classnames = require('classnames');
const {ipcRenderer} = require('electron');

const AccountMan = React.createClass({
    getInitialState: function() {
        return {
            new_account: this.props.new_account,
            new_field: "",
            new_field_type: "text",
            email_refs: [],
            account: {
                name: "",
                usename: "",
                password: "",
                is_email: false,
                email: "",
                fields: [],
            },
            account_saved: true,
        };
    },
    componentDidMount: function() {
        ipcRenderer.on("account-added",this.addResult);
        ipcRenderer.on('found-account',this.updateResult);
        ipcRenderer.on("account-updated",this.updateResult);
        ipcRenderer.on('emails-updated',this.updateEmailRefs);
    },
    disableEvent: function(event) {
        event.preventDefault();
    },
    // form methods
    updateAccountField: function(field_name,event) {
        var acc = this.state.account;
        var value = undefined;
        console.log('editing',field_name);
        switch (typeof acc[field_name]) {
            case "string":
                console.log('is string');
                value = findDOMNode(event.target).value
                break;
            case "number":
                console.log('is number');
                value = Number(findDOMNode(event.target).value);
                break;
            case "boolean":
                console.log('is bool');
                value = findDOMNode(event.target).checked;
        }
        console.log('edit value',value);
        acc[field_name] = value;
        this.setState({
            account: acc,
            account_saved: false
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
    // ipc event dispatchers
    addAccount: function() {
        var {account} = this.state;
        if(account.name !== "") {
            ipcRenderer.send("add-account",account);
        }
    },
    updateAccount: function() {
        var {account} = this.state;
        if(account.acc_name !== "") {
            ipcRenderer.send('update-account',account);
        }
    },
    // ipc event handlers
    addResult: function(event,result) {
        if(result) {
            console.log("added account to profile");
            this.setState({
                account_saved: true,
            });
        } else {
            console.log('failed to add result');
        }
    },
    updateResult: function(event,result) {
        if(result) {
            console.log("updated account in profile");
            this.setState({
                account_saved: true,
            });
        } else {
            console.log('failed to update account');
        }
    },
    updateEmailRefs: function(event,emails) {
        this.setState({
            email_refs: emails
        });
    },
    // render methods
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
        var self = this;
        return this.state.email_refs.map((value,index) => {
            var option = (self.state.account.name !== value) ? <option key={index} value={value}>{value}</option> : null;
            return option;
        });
    },
    render: function() {
        var disabled = !this.props.editing;
        var {account} = this.state;
        var form_class = classnames({
            "active": this.props.active
        });
        var new_field_class = classnames("row","grid",{
            'hidden': !this.props.editing
        });
        var hidden_class = classnames({
            "hidden": !this.props.editing
        });
        return (
            <section id="manager-form" className={form_class}>
                <form onSubmit={this.disableEvent}>
                    <input onClick={() => this.props.viewAccountMan(false,false,false)} type="button" value="Close" />
                    <label>Account Name</label>
                    <input disabled={disabled} onChange={this.updateAccountField.bind(this,'name')} type="text" value={account.name} />
                    <label>Username</label>
                    <input disabled={disabled} onChange={this.updateAccountField.bind(this,'username')} type="text" value={account.username} />
                    <label>Password</label>
                    <input disabled={disabled} onChange={this.updateAccountField.bind(this,'password')} type="password" value={account.password} />
                    <label for="is-email">is Email?</label>
                    <input onChange={this.updateAccountField.bind(this,'is_email')} id="is-email" type="checkbox" value={account.is_email} />
                    <label>Email</label>
                    <input disabled={disabled} onChange={this.updateAccountField.bind(this,'email')} type="text" value={account.email} />
                    <select disabled={disabled} onChange={this.updateEmailViaRef} className={hidden_class} value={account.email}>
                        {this.renderEmails()}
                    </select>

                    <div className={hidden_class}>
                        {this.props.new_account ?
                            <input onClick={this.addAccount} type="button" value="Add" />
                            :
                            <input onClick={this.updateAccount} type="button" value="Update" />
                        }
                    </div>
                    <div className="grid">
                        <section className={new_field_class}>
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
                        </section>
                        <section className="row grid">
                        <h4 className="row">Fields</h4>
                        <div className="row">
                            <section className="grid">
                                {this.renderFields()}
                            </section>
                        </div>
                        </section>
                    </div>
                </form>
            </section>
        )
    }
});

module.exports = AccountMan;
