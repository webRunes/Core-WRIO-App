import React from 'react';
import ReactDom from 'react-dom';
import {
    scripts
}
from './mentions/scripts';
import {
    extractMentions
}
from './mentions/mention';
import request from 'superagent';
import {
    applyMentions
}
from './mixins/mentions';
import getHttp from './getHttp';
import CoreEditor from './CoreEditor';
import {
    ContentBlock, CharacterMetadata
}
from 'draft-js';
import Immutable from 'immutable';

var domain = process.env.DOMAIN;

class Client extends React.Component {
    constructor(props) {
        super(props);
        this.state = {
            startHeader: '<h2>',
            endHeader: '</h2>',
            cleshe: '<!DOCTYPE html><html lang="en-US"><head><meta charset="utf-8">' +
                '<meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
                '<noscript><meta http-equiv="refresh" content="0; URL=//wrioos.com/no_jscript.htm"></noscript>' +
                '<meta name="description" content=""><meta name="author" content=""><meta name="keywords" content="">' +
                '<title>|TITLE|</title><script type="application/ld+json">|BODY|</script>' +
                '</head><body><script type="text/javascript" src="//wrioos.com/start.js"></script></body></html>',
            wrioID: '',
            saveUrl: '',
            saveDisabled: 0,
            STORAGE_DOMAIN: "wr.io",
            editUrl: false,
            coreAdditionalHeight: 200,
            contentBlocks: [],
            mentions: [],
            render: 0
        };
    }

    getLocation(href) {
        var match = href.match(/^(https?\:)\/\/(([^:\/?#]*)(?:\:([0-9]+))?)(\/[^?#]*)(\?[^#]*|)(#.*|)$/);
        return match && {
            protocol: match[1],
            host: match[2],
            hostname: match[3],
            port: match[4],
            pathname: match[5],
            search: match[6],
            hash: match[7]
        };
    }

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
        var article = this.getArticle("en-US", "", this.formatAuthor(this.state.wrioID), widgetData);
        var num = 1;
        for (; i < blocks.length; i++) {
            if (i == j) {
                num = this.addCoreBlock(article, blocks[i], num);
            } else {
                num = this.addParagraph(article, blocks[i], num);
            }

            var i = !blocks[0] ? 1 : 0;
            var j = i;
            var article = this.getArticle("en-US", "", "", widgetData);
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

            var fileName = (json.name === '' ? 'untitled' : json.name.split(' ').join('_')) + '.htm';
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
            this.state.editUrl = editUrl[1];
            editUrl = this.state.editUrl;
            var editUrlParsed = this.getLocation(editUrl);
            console.log("Page edit link received", editUrl);
            if (editUrlParsed) {
                if (editUrlParsed.host == this.state.STORAGE_DOMAIN) {
                    var match = editUrlParsed.pathname.match(/\/[0-9]+\/(.*)/);
                    if (match) {
                        this.state.saveUrl = match[1];
                        if (this.state.saveUrl == "" || !this.state.saveUrl) {
                            this.state.saveUrl = "index.htm"; // if no file specified, let's assume this is index.htm
                        }
                        return;
                    }
                }
            }
        }
        //this.disableSave();
    }

    initHeight() {
        var $body = $('body');
        var heightInit = $body.height();
        parent.postMessage(JSON.stringify({
            "coreHeight": heightInit
        }), "*");
    }

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
    componentWillMount() {
        this.parseEditingUrl();
        let wrioID = '';
        $.ajax({
            url: "//login." + domain + "/api/get_profile",
            type: 'get',
            'dataType': 'json',
            data: {}
        }).success((profile) => {
            console.log("Get_profile finish", profile);
            wrioID = profile.id;
        }).fail((e) => {
            //this.disableSave();
        }).always(() => {
            this.parseArticleCore(res => this.setState({
                contentBlocks: res.contentBlocks,
                mentions: res.mentions,
                wrioID,
                render: 1
            }));
        });
    }

    parseArticleCore(cb) {
        var cb = cb || function() {};

        const keyGen = () => {
            return (new Date()).getTime().toString(32) + Math.random().toString(32);
        };

        if (window.location.pathname === "/create") {
            cb({
                contentBlocks: []
            });
            return;
        }
        getHttp(this.state.editUrl, (article) => {
            if (article && article.length !== 0) {
                article = article.filter((json) => json['@type'] == 'Article')[0];
                let articleText = '',
                    contentBlocks = new Array(),
                    mentions = extractMentions(article.mentions);
                contentBlocks.push(new ContentBlock([
                    ['text', article.name],
                    ['key', keyGen()],
                    ['characterList', Immutable.List(article.name.split('').map(e => CharacterMetadata.create()))],
                    ['type', 'header-two']
                ]));
                article.articleBody.forEach((paragraph, i) => {
                    articleText += paragraph;
                });
                contentBlocks.push(new ContentBlock([
                    ['text', articleText],
                    ['key', keyGen()],
                    ['characterList', Immutable.List(articleText.split('').map(e => CharacterMetadata.create()))],
                    ['type', 'unstyled']
                ]));
                article.hasPart.forEach((subArticle) => {
                    articleText = '';
                    contentBlocks.push(new ContentBlock([
                        ['text', subArticle.name],
                        ['key', keyGen()],
                        ['characterList', Immutable.List(subArticle.name.split('').map(e => CharacterMetadata.create()))],
                        ['type', 'header-two']
                    ]));
                    if (subArticle.articleBody) {
                        subArticle.articleBody.forEach((paragraph, i) => {
                            articleText += paragraph;
                        });
                    }
                    if (subArticle.url) {
                        articleText += subArticle.url;
                    }
                    if (articleText !== '') {
                        contentBlocks.push(new ContentBlock([
                            ['text', articleText],
                            ['key', keyGen()],
                            ['characterList', Immutable.List(articleText.split('').map(e => CharacterMetadata.create()))],
                            ['type', 'unstyled']
                        ]));
                    }
                });
                cb({
                    contentBlocks, mentions
                });
            } else {
                console.log("Unable to download source article");
                cb({
                    contentBlocks: []
                });
            }
        });
    }

    render() {
        return this.state.render ? (<div className="container" cssStyles={{width: '100%'}}>
                        <CoreEditor contentBlocks={this.state.contentBlocks} mentions={this.state.mentions} saveUrl={this.state.saveUrl} author={this.formatAuthor(this.state.wrioID)}/>
                    </div>) : null;
    }
}

ReactDom.render( < Client / > , document.getElementById('clientholder'));
