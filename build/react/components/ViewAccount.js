const React = require('react');
const classnames = require('classnames');

const ViewAccount = React.createClass({

    render: function() {
        var element_class = classnames('col-10',{
            'active': this.props.active
        });
        return (
            <section id="manager-form" className={element_class}>
                <p>View Account</p>
            </section>
        )
    }
});

module.exports = ViewAccount;
