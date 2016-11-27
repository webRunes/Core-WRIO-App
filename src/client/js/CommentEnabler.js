/**
 * Created by michbil on 29.04.16.
 */
import React from 'react';
import {getWidgetID} from './webrunesAPI.js';
import WrioActions from './actions/wrio.js';

var domain = process.env.DOMAIN;

export default class CommentEnabler extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            dropdownSource: 'Disabled'
        };
        this.state.commentID = this.props.commentID;
        this.state.isChecked = this._hasCommentID();
        this.state.dropdownSource = this.state.isChecked ? "Enabled" : "Disabled";
    }

    _hasCommentID() {
        return this.state.commentID !== "";
    }

    render() {
        return (
            <div class="form-group">
                <label htmlFor="id-Comment" className="col-xs-12 col-sm-4 col-md-3 control-label">
                <span className="glyphicon glyphicon-question-sign" aria-hidden="true" data-toggle="tooltip" data-placement="left" title="Comments work through the Twitter. The Advanced mode is designed for those wishing to have full control over comments. For the reasons of security we do not save the password from you Twitter account, thus you need to re-enter it every time you turn the Advanced mode on."></span> Comments</label>
                <div className="col-xs-6 col-sm-4 col-md-4">
                    <div className="btn-group dropdown-menu-full-width">
                        <button type="button" className="btn btn-white btn-block dropdown-toggle ia-author" data-toggle="dropdown">
                            <span className="caret"></span>{this.state.dropdownSource}
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            {this.genDropdownSource('Disabled')}
                            {this.genDropdownSource('Enabled')}
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    componentDidUpdate () {
        window.frameReady();
    }

    setSource(source) {
        this.setState({
            dropdownSource: source
        });
        if (source == "Enabled") {
            this.setState({isChecked:true});
            WrioActions.commentsEnabled(true);
        }
        if (source == "Disabled") {
            WrioActions.commentsEnabled(false);
            this.setState({isChecked:false});
        }
    }

    genDropdownSource(name) {
        const active = this.state.dropdownSource == name;
        return (<li>
            <a href="#" onClick={() => this.setSource(name)}>
                {active && <span className="glyphicon glyphicon-ok pull-right"></span>}
                {name}</a>
        </li>);
    }
}

CommentEnabler.propTypes = {
    commentID: React.PropTypes.string,
    author: React.PropTypes.string,
    editUrl: React.PropTypes.string,
};
