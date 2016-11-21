/**
 * Created by michbil on 29.04.16.
 */
import React from 'react';
import {getWidgetID} from './webrunesAPI.js';

var domain = process.env.DOMAIN;

export default class CommentEnabler extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            busy: false
        };
        this.state.commentID = this.props.commentID;
        this.state.isChecked = this._hasCommentID();
    }
    onChange(state) {
        this.setState({
            isChecked: !this.state.isChecked
        });
    }
    getCommentID() {
        console.log("getCommentid started");
        this.setState({
            busy: true
        });
        getWidgetID(this.props.editUrl).then((id)=> {
            console.log("Get widget id succeded", id);
            this.setState({
                commentID: id
            });
            this.props.gotCommentID(id);
            this.setState({
                busy: false
            });
        }).catch((e) => {
            console.log("Failed to obtain widget ID");
            this.setState({
                busy: false
            });
        });
    }
    _hasCommentID() {
        return this.state.commentID !== "";
    }
    render() {
        var commentStatus = this._hasCommentID() ?
            <div className="col-sm-12">Widget id is correct and equals to {this.state.commentID}</div> :
            <div className="col-sm-12">
                <MethodPicker />
                <button type="button" className="btn btn-default" onClick={this.getCommentID.bind(this)}>Create
                comment widget
            </button>
        </div> ;

        var clearfix = {"clear":"both"};

        return (
            <div className="text-left clearfix">
                <div className="checkbox col-sm-2">
                    <label><input type="checkbox" value=""
                                  checked={this.state.isChecked}
                                  onChange={this.onChange.bind(this)}
                        />Allow comments</label>
                </div>

                {this.state.isChecked ? commentStatus : ""}


                {this.state.busy ?
                    <div className="col-sm-12">
                        <img src="https://wrioos.com/Default-WRIO-Theme/img/loading.gif"/>Obtaining widget id....
                    </div> : ""}
                <div style={clearfix}></div>
            </div>);
    }

    componentDidUpdate () {
        window.frameReady();
    }
}

CommentEnabler.propTypes = {
    commentID: React.PropTypes.string,
    author: React.PropTypes.string,
    editUrl: React.PropTypes.string,
    gotCommentID: React.PropTypes.func
};

class MethodPicker extends React.Component {

    constructor(props) {
        super(props);
        this.state={
            dropdownSource: 'Disabled'
        }
    }

    setSource(source) {
        this.setState({
            dropdownSource: source
        });
    }

    genDropdownSource(name) {
        const active = this.state.dropdownSource == name;
        return (<li>
            <a href="#" onClick={() => this.setSource(name)}>
                {active && <span className="glyphicon glyphicon-ok pull-right"></span>}
                {name}</a>
        </li>);
    }

    render() {
        return (<div className="clearfix">
            <div className="form-group">
                <label htmlFor="id-Storage" className="col-xs-12 col-sm-4 col-md-3 control-label"><span className="glyphicon glyphicon-question-sign" aria-hidden="true" data-toggle="tooltip" data-placement="left" title="Use [Save as..] to save your file locally for its further manual transfer to any server or service such as Google Drive, Dropbox, GitHub Pages and etc."></span> Storage</label>
                <div className="col-xs-6 col-sm-4 col-md-4">
                    <div className="btn-group dropdown-menu-full-width">
                        <button type="button" className="btn btn-white btn-block dropdown-toggle ia-author" data-toggle="dropdown">
                            <span className="caret"></span>{this.state.dropdownSource}
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            {this.genDropdownSource('Disabled')}
                            {this.genDropdownSource('Enabled')}
                            <li className="divider" />
                            {this.genDropdownSource('Custom')}
                        </ul>
                    </div>
                    <div className="help-block"><a href="">Need help?</a></div>
                </div>
            </div>
            <div className="radio">
                <label><input type="radio" name="optradio" value="1"/>Get comment widget id from webRunes (Recommended,
                    no
                    additional actions required)</label>
            </div>

            <div className="radio">
                <label><input type="radio" name="optradio"/>Get comment widget id from your twitterAccount(You
                    will be required to enter your twitter account password, your password will be not used or
                    stored by webRunes in any way</label>
            </div>

            <div className="radio">
                <label><input type="radio" name="optradio" disabled/>Specify your own comment id</label>
            </div>
        </div>);
    }
}