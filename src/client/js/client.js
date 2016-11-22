import 'es6-shim';
import React, {Component} from 'react';
import ReactDom from 'react-dom';
import request from 'superagent';
import {applyMentions} from './mixins/mentions';
import getHttp from './getHttp';
import CoreEditor from './CoreEditor';
import {ContentBlock, CharacterMetadata} from 'draft-js';
import Immutable from 'immutable';
import JSONDocument from './JSONDocument.js';
import CommentSaver from './CommentSaver.js';
import {urlMatch as CommentSaverUrlMatch} from './CommentSaver.js';
import { getRegistredUser} from './webrunesAPI.js';
import {parseEditingUrl, extractFileName, parseUrl, appendIndex} from './utils/url.js';
import WrioStore from './stores/wrio.js';

var domain = process.env.DOMAIN;

class Loading extends Component {
    render () {
        return (<div>
                Loading source page....
                <img src="https://default.wrioos.com/img/loading.gif" id="loadingInd"/>
            </div>);
    }
}

class LoadingError extends Component {
    render () {
        return (<div>
            Oops, something went wrong during downloading of the page, please try again
        </div>);
    }
}


class Client extends Component {
    constructor(props) {
        super(props);
        this.state = {
            startHeader: '<h2>',
            endHeader: '</h2>',
            wrioID: '',
            saveUrl: '',
            saveDisabled: 0,
            editUrl:'',
            coreAdditionalHeight: 200,
            mentions: [],
            commentID: "",
            render: 0,
            doc: null,
            error: false
        };
        this.parseEditingUrl = this.parseEditingUrl.bind(this);
        this.parseArticleCore = this.parseArticleCore.bind(this);
    }
    formatAuthor(id) {
        return id ? `https://wr.io/${id}/?wr.io=${id}` : 'unknown';
    }
    parseEditingUrl() {
        const [editUrl, saveRelativePath] = parseEditingUrl();
        this.setState({
            editUrl: editUrl,
            saveRelativePath: saveRelativePath
        });
    }
    componentWillMount() {
        document.getElementById("loadingInd").style = 'display:none;';
        this.parseEditingUrl();
        let wrioID = null;
        WrioStore.listen((state) => {
            this.parseArticleCore(state.wrioID).then((res)=>
                    this.setState({
                        wrioID,
                        render: 1
                    })
            ).catch((e)=> console.error(e.stack));
        });
    }
    parseArticleCore(author) {
        return new Promise((resolve, reject)=> {
            if (window.location.pathname === "/create") {
                var doc = new JSONDocument();
                doc.createArticle(author, "");
                this.setState({
                    doc: doc
                });
                resolve();
            } else {
                getHttp(this.state.editUrl).then((article) => {
                    setTimeout(window.frameReady, 300);
                    var doc = new JSONDocument(article);
                    this.setState({
                       doc: doc,
                       commentID: doc.getCommentID()
                    });
                    resolve();
                }).catch(error=> {
                    console.log("Unable to download source article",error);
                    this.setState({error:true});
                });
            }
        });
    }

    componentDidUpdate() {
        frameReady();
    }

    render() {
        return (
            <div cssStyles={{width: '100%'}} className="clearfix">
                {this.state.error? <LoadingError /> : ""}
                {this.state.render ? <CoreEditor doc={this.state.doc}
                            saveRelativePath={this.state.saveRelativePath}
                            editUrl={this.state.editUrl}
                            author={this.formatAuthor(this.state.wrioID)}
                            commentID={this.state.commentID} /> :
                    <Loading /> }

            </div>
        );
    }
}

// TODO switch to full routing there
ReactDom.render( CommentSaverUrlMatch() ? <CommentSaver /> : <Client /> , document.getElementById('clientholder'));

var oldHeight = 0;
window.frameReady = () => {
    let height = document.querySelector('#clientholder').clientHeight + 50;
    if (height != oldHeight) {
        oldHeight = height;
        console.log("Height ready");
        parent.postMessage(JSON.stringify({
            "coreHeight": height
        }), "*");
    }
};
