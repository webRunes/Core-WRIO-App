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
        return this.state.render ? (<div className="container" cssStyles={{width: '100%'}}>
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


/*    replaceLineFeed(someText) {
 var re = /\r\n|\n\r|\n|\r/g;
 return someText.replace(re, "");
 }

 getMentionsItem(name, about, link) {
 return {
 "@type": "Article",
 "name": name,
 "about": about,
 "url": link
 };
 };

 destroyClickedLink(event) {
 document.body.removeChild(event.target);
 }

 normalizeText(text) {
 text = text.replace(/<p>/gi, '')
 .replace(/<\/p>/gi, '<br>');
 text = text.replace(/<div>/gi, '')
 .replace(/<\/div>/gi, '<br>');
 text = text.replace(/<br><br>/gi, '<br>');
 text = text.replace(/<br><\/li>/gi, '</li>');

 text = this.normalizeQuote(text);
 return text;
 }

 normalizeOUL(arr) {
 var regOl = /<ol>/gi;
 var regUl = /<ul>/gi;
 var list = [];
 for (var i = 0; i < arr.length; i++) {
 if (regOl.test(arr[i])) {
 this.convertOUlToList(list, arr[i], 0);
 } else if (regUl.test(arr[i])) {
 this.convertOUlToList(list, arr[i], 1);
 } else {
 list.push(arr[i]);
 }
 }
 return list;
 }

 normalizeQuote(txt) {
 var reg = /(<blockquote>([\s\S]+?)<\/blockquote>)/gi;

 var blocks = txt.match(reg);
 if (!blocks || !blocks.length) {
 return txt;
 }

 for (var i = 0; i < blocks.length; i++) {
 var item = blocks[i].replace('<blockquote>', '<br>')
 .replace('</blockquote>', '<br>');
 var ps = item.split('<br>');
 var newBlocks = ['<br>'];
 for (var j = 0; j < ps.length; j++) {
 if (ps[j]) {
 ps[j] = '> ' + ps[j] + '<br>';
 newBlocks.push(ps[j]);
 }
 }
 txt = txt.replace(blocks[i], newBlocks.join(''));
 }

 return txt;
 }

 normalizeWidgetData(widgetData) {
 var data_widget_id = widgetData.match(/([^0-9])/i);
 if (data_widget_id) {
 var result = widgetData.match(/data-widget-id=\"([0-9]+)\"/i);
 if (result) {
 data_widget_id = result[1];
 } else {
 return "";
 }
 } else {
 data_widget_id = widgetData;
 }
 return data_widget_id;
 }

 convertOUlToList(list, txt, isOu) {
 txt = txt.replace(/<ol>/gi, '<br>')
 .replace(/<ul>/gi, '<br>')
 .replace(/<\/ol>/gi, '<br>')
 .replace(/<\/ul>/gi, '<br>')
 .replace(/<\/li>/gi, '<br>');
 var arr = txt.split('<br>');

 var ind = 1;
 for (var i = 0; i < arr.length; i++) {
 var text = arr[i];
 if (text) {
 if (arr[i].indexOf('<li>') == 0) {
 var num = ind + '. ';
 if (!!isOu) {
 num = '* ';
 }
 text = text.replace('<li>', num);
 ind += 1;
 }
 list.push(text);
 }
 }
 }
 }



 calculateJson(text, widgetData) {
 if (!text) {
 return '';
 }

 text = this.normalizeText(text);
 widgetData = this.normalizeWidgetData(widgetData);

 var blocks = text.split(this.state.startHeader);
 if (!blocks.length) {
 return '';
 }

 var i = !blocks[0] ? 1 : 0;
 var j = i;
 var article = this.getArticle("En", "", this.formatAuthor(this.state.wrioID), widgetData);
 var num = 1;
 for (; i < blocks.length; i++) {
 if (i == j) {
 num = this.addCoreBlock(article, blocks[i], num);
 } else {
 num = this.addParagraph(article, blocks[i], num);
 }

 var i = !blocks[0] ? 1 : 0;
 var j = i;
 var article = this.getArticle("En", "", "", widgetData);
 var num = 1;
 for (; i < blocks.length; i++) {
 if (i == j) {
 num = this.addCoreBlock(article, blocks[i], num);
 } else {
 num = this.addParagraph(article, blocks[i], num);
 }
 }

 return article;
 }

 checkMention(arr, txt, num) {
 var reg1 = /<a/i;
 var reg2 = /<\/a>/i;
 var regHref = /href=["|']([^'"]+)/i;
 var regTitle = /<a [^>]+>([^<]+)<\/a>/i;

 var ind;
 while ((ind = txt.search(reg1)) >= 0) {
 var end = txt.search(reg2) + 4;
 var a = txt.substring(ind, end);

 var name = regTitle.exec(a)[1];
 var link = regHref.exec(a)[1];
 link = link.split('?');
 var _name = link[1] || "";
 link = link[0];
 link += "?'" + name + "':" + num + "," + ind;

 txt = txt.replace(a, name);
 var ment = this.getMentionsItem(_name, '', link);
 arr.push(ment);
 }
 return txt;
 }

 addCoreBlock(json, txt, num) {
 if (!txt) {
 return num;
 }
 var blocks = txt.split(this.state.endHeader);

 var name = blocks.length == 2 ? blocks[0] : '';
 name = this.checkMention(json.mentions, name, 1);
 name = this.replaceLineFeed(name);

 json.name = name;

 var ps = blocks[blocks.length - 1].split('<br>');
 ps = this.normalizeOUL(ps);
 for (var i = 0; i < ps.length; i++) {
 if (ps[i].trim() !== "") {
 ps[i] = ps[i].replace(/&nbsp;/gi, ' ');
 var p = this.checkMention(json.mentions, ps[i], num + 2);
 p = this.replaceLineFeed(p);
 json.articleBody.push(p);
 }
 num += 1;
 }

 return num;
 }

 addParagraph(json, txt, num) {
 if (!txt) {
 return num;
 }
 var regHttp = /(https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*))/i;
 var regTitle = /<a [^>]+>([^<]+)<\/a>/i;
 var regHref = /href=["|']([^'"]+)/i;
 var blocks = txt.split(this.state.endHeader);

 var name = blocks[0];
 name = this.checkMention(json.mentions, name, num + 1);
 name = this.replaceLineFeed(name);

 var part = this.getPart(name);

 var ps = blocks[1].split('<br>');
 ps = this.normalizeOUL(ps);
 for (var i = 0; i < ps.length; i++) {
 if (ps[i].trim() !== "") {
 if (ps[i].replace(regHttp, "").trim() !== "") {
 part.articleBody = part.articleBody || [];
 ps[i] = ps[i].replace(/&nbsp;/gi, ' ');
 var p = this.checkMention(json.mentions, ps[i], num + 2);
 p = this.replaceLineFeed(p);
 part.articleBody.push(p);
 num += 1;
 } else {
 part.url = regHref.exec(ps[i]) ? regHref.exec(ps[i])[1] : regHttp.exec(ps[i])[1];
 }
 } else {
 num += 1;
 }
 }

 json.hasPart.push(part);

 return num;
 }

 */
/*    save() {
 var widgetData = $(this.state.$textarea_widget)
 .val();
 var txt = $(this.state.$textarea)
 .val();
 var json = this.calculateJson(txt, widgetData);
 if (!json) {
 return;
 }

 var textToWrite = this.state.cleshe.replace('|BODY|', JSON.stringify(json));
 textToWrite = textToWrite.replace('|TITLE|', json.name);



 //ToDo: test
 var url = this.state.saveUrl;
 var contents = "<html></html>";
 $.ajax({
 url: "https://crossorigin.me/https://storage." + domain + "/api/save",
 type: 'post',
 'dataType': 'json',
 data: {
 'url': url,
 'bodyData': textToWrite
 }
 })
 .success((res) => {
 parent.postMessage(JSON.stringify({
 "coreSaved": true
 }), "*");
 // window.location = res.url;
 }).error(err => {
 console.log(err);
 });
 };

 disableSave() {
 this.state.saveDisabled = 1;
 }

 saveAs() {
 var widgetData = $(this.state.$textarea_widget)
 .val();
 var txt = $(this.state.$textarea)
 .val();
 var json = this.calculateJson(txt, widgetData);
 if (!json) {
 return;
 }

 var textToWrite = this.state.cleshe.replace('|BODY|', JSON.stringify(json));
 textToWrite = textToWrite.replace('|TITLE|', json.name);

 var ie = navigator.userAgent.match(/MSIE\s([\d.]+)/);
 var ie11 = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/);
 var ieEDGE = navigator.userAgent.match(/Edge/g);
 var ieVer = (ie ? parseInt(ie[1]) : (ie11 ? 11 : -1));

 var fileName = (json.name === '' ? 'untitled' : json.name.split(' ').join('_')) + '.html';
 if (ie || ie11 || ieEDGE) {
 if (ieVer > 9 || ieEDGE) {
 var textFileAsBlob = new Blob([textToWrite], {
 type: 'text/plain'
 });
 window.navigator.msSaveBlob(textFileAsBlob, fileName);
 } else {
 console.log("IE v.10 or higher required");
 return;
 }
 } else {
 var downloadLink = document.createElement("a");
 downloadLink.download = fileName;
 downloadLink.innerHTML = "My Hidden Link";

 window.URL = window.URL || window.webkitURL;
 textFileAsBlob = new Blob([textToWrite], {
 type: 'text/plain'
 });
 downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
 downloadLink.onclick = this.destroyClickedLink.bind(this);
 downloadLink.style.display = "none";
 document.body.appendChild(downloadLink);

 downloadLink.click();
 }
 }
 */

/*    createTextArea(args) {
 var that = this,
 args = args || {},
 text = args.text || '';
 $('#textarea-core-id').wysihtml5({
 toolbar: {
 custom1: false,
 "customFontStyles": true,
 "font-styles": false,
 "emphasis": false,
 "lists": true,
 "html": false,
 "link": true,
 "image": false,
 "color": false,
 "blockquote": true,
 "save": true,
 "saveAs": true
 },
 events: {
 load: function() {

 console.log("Loaded..");
 var $iframe = $(this.composer.editableArea);
 var $body = $(this.composer.element);
 $body.focus();
 $body.css({
 'min-height': 0,
 'line-height': '20px',
 'overflow': 'hidden',
 });
 console.log($body.height());
 var heightInit = $body.height();
 $iframe.height(heightInit);
 $iframe.text(text);
 // parent.postMessage(JSON.stringify({"coreHeight": heightInit + that.state.coreAdditionalHeight}), "*");
 $body.bind('keypress keyup keydown paste change focus blur', (e) => {
 var height = $body[0].scrollHeight; // 150
 $iframe.height(height);
 parent.postMessage(JSON.stringify({
 "coreHeight": height + that.state.coreAdditionalHeight
 }), "*");
 });

 if (that.state.saveDisabled) {
 $('#save-button-id div a').addClass('disabled');
 } else {
 $('#save-button-id')
 .on('click', () => {
 console.log("Save click");
 that.save();
 });
 }
 $('#save-as-button-id')
 .on('click', that.saveAs.bind(that));

 that.state.$textarea = $('#textarea-core-id');
 that.state.$textarea_widget = $('#textarea-widget-id');
 }
 },
 customTemplates: CustomTemplates
 });

 }
 */
