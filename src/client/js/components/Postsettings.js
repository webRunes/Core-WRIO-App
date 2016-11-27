/**
 * Created by michbil on 19.11.16.
 */

import React from 'react';
import {parseEditingUrl, extractFileName, parseUrl, appendIndex} from '../utils/url.js';
import WrioStore from '../stores/wrio.js';
import CommentEnabler from '../CommentEnabler.js';

export default class PostSettings extends React.Component {
    constructor(props) {
        super(props);
        this.source = 'save';
        this.dropdownSources = {
            'save':"WRIO OS",
            "saveas":"Save as.."
        };
        const [editUrl, saveRelativePath] = parseEditingUrl();
        this.state = {
            maxLength: 512,
            saveFile: "untitled",
            dropdownSource: this.dropdownSources['save'],
            editUrl,
            saveRelativePath,
            busy: false
        };
        Object.assign(this.state,this.applyDescription(props.description));

    }

    componentDidMount() {
        WrioStore.listen(this.storeListener.bind(this));
    }

    storeListener(state) {
        this.setState({busy: state});
    }


    publish() {
        this.props.onPublish(this.source,`${this.state.saveFile}.html`,this.state.description);
    }

    setSource(src) {
        this.source = src;
        this.setState({
            dropdownSource: this.dropdownSources[src]
        });
    }

    onChangeDescr(e) {
        this.setState(this.applyDescription(e.target.value));
    }

    applyDescription(value) {
        if (value.length >= this.state.maxLength) {
            return({
                exceedLength: true,
                description: value
            });
        } else {
            return({
                exceedLength: false,
                description: value
            });
        }
    }

    onChangeFile(e) {
        this.setState({
            saveFile: e.target.value
        });
    }

    genDropdownSource(name) {
        const active = this.state.dropdownSource == this.dropdownSources[name];
        return (<li>
            <a href="#" onClick={() => this.setSource(name)}>
                {active && <span className="glyphicon glyphicon-ok pull-right"></span>}
                {this.dropdownSources[name]}</a>
        </li>);
    }

    getSaveUrl() {
        return this.props.saveUrl || `https://wr.io/${WrioStore.getWrioID()}/${this.state.saveFile}.html`;
    }

    render () {
        const loading = <img src="https://default.wrioos.com/img/loading.gif" />;
        let savePath = this.getSaveUrl();
        const className ="form-group" +  (this.state.exceedLength ? " has-error" : "");
        return (<div className="form-horizontal">
            <div className="callout">
                <h5>You are not logged in</h5>
                You can still create posts. However, you need to be logged in to save access path and to received donates.
            </div>
            <div className={className}>
                <label htmlFor="id-Description" className="col-sm-4 col-md-3 control-label">Description</label>
                <div className="col-sm-8 col-md-9">
                    <textarea className="form-control" type="text" maxLength="512"
                           cols="40"
                           rows="6"
                           placeholder="Optional. Max 512 characters"
                           value={this.state.description}
                           onChange={this.onChangeDescr.bind(this)} />
                    <div className="help-block">
                        {this.state.exceedLength && <span>Max {this.state.maxLength} characters</span>}
                    </div>
                </div>
            </div>
            <div class="form-group">
                <label htmlFor="id-Storage" className="col-xs-12 col-sm-4 col-md-3 control-label"><span className="glyphicon glyphicon-question-sign" aria-hidden="true" data-toggle="tooltip" data-placement="left" title="Use [Save as..] to save your file locally for its further manual transfer to any server or service such as Google Drive, Dropbox, GitHub Pages and etc."></span> Storage</label>
                <div className="col-xs-6 col-sm-4 col-md-4">
                    <div className="btn-group dropdown-menu-full-width">
                        <button type="button" className="btn btn-white btn-block dropdown-toggle ia-author" data-toggle="dropdown">
                            <span className="caret"></span>{this.state.dropdownSource}
                        </button>
                        <ul className="dropdown-menu" role="menu">
                            {this.genDropdownSource('save')}
                            {this.genDropdownSource('saveas')}
                        </ul>
                    </div>
                </div>
                {!this.props.saveUrl && <div className="col-xs-6 col-sm-4 col-md-5">
                    <input type="text"
                           className="form-control"
                           id="File-name"
                           placeholder="Untitled"
                           value={this.state.saveFile}
                           onChange={this.onChangeFile.bind(this)}
                        />
                    <div className="help-block">Your page will be live at {savePath}</div>
                </div>}
            </div>
            <CommentEnabler commentID={this.props.commentID}
                            author={this.props.author}
                            editUrl={this.getSaveUrl()}
                            />

            <div className="col-xs-12">
                <div className="pull-right">
                    <button type="button" className="btn btn-default"><span className="glyphicon glyphicon-remove" onClick={this.goBack.bind(this)}></span>Cancel</button>
                    <a href="#" className="btn btn-success" onClick={this.publish.bind(this)}>
                        {this.state.busy ? loading : <span className="glyphicon glyphicon-open" />}
                       Publish</a>
                </div>
            </div>
        </div>);
    }
    goBack() {
        parent.postMessage(JSON.stringify({
            "coreSaved": true
        }), "*");
    }
}

PostSettings.propTypes = {
    saveUrl: React.PropTypes.string,
    description: React.PropTypes.string,
    onPublish: React.PropTypes.func,
    commentID:React.PropTypes.string,
    author:React.PropTypes.string
};