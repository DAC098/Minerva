const React = require('react');

const LoginComp = React.createClass({
    getInitialState: function() {
        return {
            username: '',
            password: '',
            confirm: {
                valid: true,
                str: '',
            },
            is_creating: false,
        }
    },
    set: function(key,event) {
        let {username,password,confirm} = this.state;
        switch (key) {
            case 'username':
                username = event.target.value;
                this.setState({username});
                break;
            case 'password':
                password = event.target.value;
                this.setState({password});
                break;
            case 'confirm':
                console.log('valid:',confirm.valid);
                confirm.str = event.target.value;
                confirm.valid = password === confirm.str;
                this.setState({confirm});
                break;
        }
    },
    isCreating: function() {
        this.setState({is_creating: !this.state.is_creating});
    },
    login: function() {
        let {username,password} = this.state;
        this.props.login(username,password);
    },
    create: function() {
        let {username,password,confirm} = this.state;
        if(confirm.valid) {
            console.log('sending username and password');
            this.props.create(username,password);
        } else {
            console.log('confrim and password are not the same');
            console.log('password:',password,', confirm:',confirm.str);
        }
    },
    render: function() {
        return (
            <section>
                <div>
                    <input onChange={(event) => this.set('username',event)} type="text" placeholder="Username" value={this.state.username} />
                    <input onChange={(event) => this.set('password',event)} type='password' placeholder='Password' value={this.state.password} />
                    { this.state.is_creating ?
                        <input onChange={(event) => this.set('confirm',event)} type='password' placeholder='Confirm Password' value={this.state.confirm.str} />
                        :
                        null
                    }
                    { !this.state.is_creating ?
                        <div>
                            <input onClick={this.login} type='button' value='Login' />
                            <input onClick={this.isCreating} type='button' value='Create' />
                        </div>
                        :
                        <div>
                            <input onClick={this.create} type='button' value='Create' />
                            <input onClick={this.isCreating} type='button' value='Cancel' />
                        </div>
                    }
                </div>
            </section>
        )
    }
});

module.exports = LoginComp;
