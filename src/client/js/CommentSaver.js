/**
 * Created by michbil on 10.05.16.
 */

import JSONDocument from './JSONDocument.js';
import {saveToS3,getWidgetID} from './webrunesAPI.js';
import React from 'react';
import getHttp from './getHttp.js';

export function urlMatch () {
    return window.location.search.match(/\?comment_article=([\.0-9a-zA-Z%:\/?]*)/);
}



export default class CommentSaver extends React.Component {
    constructor(props) {
        super(props);
        var editUrl = urlMatch();
        if (editUrl) {
            editUrl = editUrl[1];

        }
        this.state = {
            busy: true,
            url: editUrl,
            msg: "Downloading page..."
        };
    }

    componentDidMount() {
        document.getElementById("loadingInd").style = 'display:none;';
       this.saveComment(this.state.url);
    }

    saveComment(url) {
        getHttp(url, (article) => {

            setTimeout(window.frameReady, 300);

            if (article && article.length !== 0) {

                this.setState({msg:"Receiving comment id...."});
                getWidgetID(url).then((id)=>{
                    var doc = new JSONDocument(article);
                    doc.json.commentID = id;
                    var html = doc.toHtml();
                    this.setState({msg:"Saving page to S3...."});
                    return saveToS3(url,html);
                })
                .then((res) => {
                        this.setState({msg:"Success!",busy:false});
                }).catch((err) => {
                    console.log(err);
                    this.setState({msg:"Oops... something went wrong"});
                });
            }
        });
    }


    render() {
        return (<div>
            {this.state.busy ?
                <div className="col-sm-12">
                    <img src="https://wrioos.com/Default-WRIO-Theme/img/loading.gif"/>
                </div> : ""}
            <div>{this.state.msg}</div>
        </div>);
    }
}