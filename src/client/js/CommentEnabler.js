/**
 * Created by michbil on 29.04.16.
 */
import React from 'react';

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
        $.ajax({
            url: "//titter." + domain + "/obtain_widget_id?query=" + this.props.editUrl,
            type: 'get',
            xhrFields: {
                withCredentials: true
            }
        }).done((id,ts,jq) => {
            console.log("Get widget id succeded", id);
            this.setState({
                commentID: id
            });
            this.props.gotCommentID(id);
        }).fail((e) => {
            console.log("Failed to obtain widget ID");
        }).always(() => {
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

        return (
            <div className="text-left">
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
    render() {
        return (<div>
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