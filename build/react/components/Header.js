const React = require('react');

const Header = React.createClass({

    render: function() {
        return (
            <header className="grid row">
                <section className="col-4"></section>
                <section className="col-4"></section>
                <section className="col-4">
                    <button onClick={this.props.viewForm}>View Form</button>
                </section>
            </header>
        )
    }
});

module.exports = Header;
