import React from 'react';
import ReactDom from 'react-dom';
import {scripts} from './mentions/scripts';
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

class Client extends React.Component {
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
            contentBlocks: [],
            mentions: [],
            commentID: "",
            render: 0,
            doc: null
        };
    }


  formatAuthor(id) {
        if (id) {
            return "https://wr.io/" + id + '/?wr.io=' + id;
        } else {
            return "unknown";
        }

    }



    parseEditingUrl() {
        var editUrl = window.location.search.match(/\?article=([\.0-9a-zA-Z%:\/?]*)/);
        if (editUrl) {

            editUrl = appendIndex(editUrl[1]);
            this.setState({
                editUrl: editUrl
            });

            var editUrlParsed = parseUrl(editUrl);
            console.log("Page edit link received", editUrl);
            if (editUrlParsed) {
                if (editUrlParsed.host == this.state.STORAGE_DOMAIN) {
                    this.state.saveRelativePath = extractFileName(editUrlParsed.pathname);
                }
            }
        }
        //this.disableSave();
    }



    componentWillMount() {
        this.parseEditingUrl();

        getRegistredUser().then((wrioID)=>{
            this.parseArticleCore(wrioID, res => this.setState({
                wrioID,
                render: 1
            }));
        }).catch((e)=>{

        });
    }

    parseArticleCore(author,cb) {
        var cb = cb || function() {};

        if (window.location.pathname === "/create") {

            var doc = new JSONDocument();
            doc.createArticle(author, "");

            this.setState({
                doc: doc
            });
            return cb();

        }
        getHttp(this.state.editUrl, (article) => {

            setTimeout(window.frameReady, 300);
            document.getElementById("loadingInd").style = 'display:none;';

            if (article && article.length !== 0) {

                var doc = new JSONDocument(article);
                this.setState({
                   doc: doc,
                   commentID: doc.getCommentID()
                });

            } else {
                console.log("Unable to download source article");
            }
            cb();
        });
    }


    render() {
        return this.state.render ? (<div cssStyles={{width: '100%'}}>
                        <CoreEditor doc={this.state.doc}
                                    saveRelativePath={this.state.saveRelativePath}
                                    editUrl={this.state.editUrl}
                                    author={this.formatAuthor(this.state.wrioID)}
                                    commentID={this.state.commentID}
                            />
                    </div>) : null;
    }
}


// TODO switch to full routing there
if (CommentSaverUrlMatch()) {
    ReactDom.render( < CommentSaver /> , document.getElementById('clientholder'));
} else {
    ReactDom.render( < Client /> , document.getElementById('clientholder'));
}

var oldHeight = 0;
window.frameReady = () => {

    var $body = $('.container');
    var heightInit = $body.height()+30;

    if (heightInit == oldHeight) return;
    oldHeight = heightInit;
    console.log("Height ready");

    parent.postMessage(JSON.stringify({
        "coreHeight": heightInit
    }), "*");
};

