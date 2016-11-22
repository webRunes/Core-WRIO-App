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
            busy: false,
            dropdownSource: 'Disabled'
        };
        this.state.commentID = this.props.commentID;
        this.state.isChecked = this._hasCommentID();
        this.state.dropdownSource = this.state.isChecked ? "Enabled" : "Disabled";
    }


    getCommentID() {
        console.log("getCommentid started");
        this.setState({
            busy: true
        });
        getWidgetID(this.props.editUrl).then((id)=> {
            console.log("Success. We've got a widget ID", id);
            this.setState({
                commentID: id
            });
            this.props.gotCommentID(id);
            this.setState({
                busy: false
            });
        }).catch((e) => {
            console.log("Fail. Can't obtain a widget ID");
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
            <div className="col-sm-12">Widget ID: {this.state.commentID}</div> :
            <div className="col-sm-12">
                <MethodPicker />
                <button type="button" className="btn btn-info" onClick={this.getCommentID.bind(this)}>Create comment widget
            </button>
        </div> ;

        var clearfix = {"clear":"both"};

        return (
            <div className="col-xs-12 text-left clearfix">
                <div className="form-group">
                    <label htmlFor="id-Storage" className="col-xs-12 col-sm-4 col-md-3 control-label">
                        <span className="glyphicon glyphicon-question-sign" aria-hidden="true" data-toggle="tooltip" data-placement="left" title="Комментарии работают с помощью Твиттера. Всю информацию вы найдете по ссылке Need help?. Режим Advanced для тех, кто хочет иметь полный контроль над комментариями. Ради безопасности мы не сохраняем пароль от вашего Твиттер аккаунта, поэтому его нужно вводить каждый раз при включении Advanced mode"></span> Comments</label>
                    <div className="col-xs-6 col-sm-8 col-md-9">
                        <div className="btn-group dropdown-menu-full-width">
                            <button type="button" className="btn btn-white btn-block dropdown-toggle ia-author" data-toggle="dropdown">
                                <span className="caret"></span>{this.state.dropdownSource}
                            </button>
                            <ul className="dropdown-menu" role="menu">
                                {this.genDropdownSource('Disabled')}
                                {this.genDropdownSource('Enabled')}
                            </ul>
                        </div>
                        {this.state.isChecked ? commentStatus : ""}

                        {this.state.busy ?
                            <div className="col-sm-12">
                                <img src="https://default.wrioos.com/img/loading.gif"/>Obtaining a widget ID...
                            </div> : ""}
                    </div>

                </div>


                <div style={clearfix}></div>
            </div>);
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
        }
        if (source == "Disabled") {
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
    gotCommentID: React.PropTypes.func
};

class MethodPicker extends React.Component {

    render() {
        return (<div className="clearfix">

            <div className="radio">
                <label><input type="radio" name="optradio" value="1" checked="checked"/>Recommended, no action is required on your part</label>
            </div>

            <div className="radio">
                <label><input type="radio" name="optradio"/>Advanced. To create your own Twitter widget you will be required to enter your Twitter account password that will be used just once</label>
            </div>
        </div>);
    }
}