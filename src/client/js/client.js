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
import {extractFileName, parseUrl, getRegistredUser,appendIndex} from './webrunesAPI.js';

var domain = process.env.DOMAIN;

class Client extends Component {
    constructor(props) {
        super(props);
        this.state = {
            startHeader: '<h2>',
            endHeader: '</h2>',
            wrioID: '',
            saveUrl: '',
            saveDisabled: 0,
            STORAGE_DOMAIN: "wr.io",
            editUrl:'',
            coreAdditionalHeight: 200,
            mentions: [],
            commentID: "",
            render: 0,
            doc: null
        };
        this.parseEditingUrl = this.parseEditingUrl.bind(this);
        this.parseArticleCore = this.parseArticleCore.bind(this);
    }
    formatAuthor(id) {
        return id ? `https://wr.io/${id}/?wr.io=${id}` : 'unknown';
    }
    parseEditingUrl() {
        let editUrl = window.location.search.match(/\?article=([\.0-9a-zA-Z%:\/?]*)/);
        if (editUrl) {
            editUrl = appendIndex(editUrl[1]);
            this.setState({
                editUrl: editUrl
            });
            let editUrlParsed = parseUrl(editUrl);
            console.log("Page edit link received", editUrl);
            if (editUrlParsed && editUrlParsed.host == this.state.STORAGE_DOMAIN) {
                this.state.saveRelativePath = extractFileName(editUrlParsed.pathname);
            }
        }
    }
    componentWillMount() {
        this.parseEditingUrl();
        let wrioID = null;
        getRegistredUser().then((data)=> 
            this.parseArticleCore(wrioID = data)
        ).then((res)=> 
            this.setState({
                wrioID,
                render: 1
            })
        ).catch((e)=> console.error(e.stack));
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
                });
            }
        });
    }
    render() {
        return !this.state.render ? null : (
            <div cssStyles={{width: '100%'}}>
                <CoreEditor doc={this.state.doc}
                            saveRelativePath={this.state.saveRelativePath}
                            editUrl={this.state.editUrl}
                            author={this.formatAuthor(this.state.wrioID)}
                            commentID={this.state.commentID} />
            </div>
        );
    }
}

// TODO switch to full routing there
ReactDom.render( CommentSaverUrlMatch() ? <CommentSaver /> : <Client /> , document.getElementById('clientholder'));

var oldHeight = 0;
window.frameReady = () => {
    let height = document.querySelector('#clientholder').clientHeight + 10;
    if (height != oldHeight) {
        oldHeight = height;
        console.log("Height ready");
        parent.postMessage(JSON.stringify({
            "coreHeight": height
        }), "*");
    }
};
