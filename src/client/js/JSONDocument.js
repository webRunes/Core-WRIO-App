/**
 * Created by michbil on 09.05.16.
 */

import {extractMentions} from './mentions/mention';
import Immutable from 'immutable';
import {ContentBlock, CharacterMetadata, Entity} from 'draft-js';


var cleshe = '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<noscript><meta http-equiv="refresh" content="0; URL=https://wrioos.com/no_jscript.html"></noscript>' +
    '<meta name="description" content=""><meta name="author" content=""><meta name="keywords" content="">' +
    '<title>|TITLE|</title>|BODY|' +
    '</head><body><script type="text/javascript" src="https://wrioos.com/start.js"></script></body></html>';

const keyGen = () => 
    (new Date()).getTime().toString(32) + Math.random().toString(32);


const getPart = (name) => ({
        "@type": "Article",
        "name": name,
        "articleBody": []
    });

const getMention = (name, about, link) => ({
        "@type": "Article",
        "name": name,
        "about": about,
        "link": link
    });


class GenericLDJsonDocument {
    constructor(article = []) {
        this.jsonBlocks = article;
    }
    getElementOfType(type) {
        var rv;
        this.jsonBlocks.forEach((element) => {
            if (element["@type"] === type) {
                rv = element;
            }
        });
        return rv;
    }
    makeArticle(lang, keywords, author, widgetData) {
        return {
            "@context": "http://schema.org",
            "@type": "Article",
            "inLanguage": lang,
            "keywords": keywords,
            "author": author,
            "editor": "",
            "name": "",
            "about": "",
            "articleBody": [],
            "hasPart": [],
            "mentions": [],
            "comment": widgetData
        };
    };
    createArticle(author,commentID) {
        if (this.getElementOfType("Article")) {
            console.log("Failed to create article, it already exists");
        } else {
            this.jsonBlocks.push(this.makeArticle("En", "", author, commentID));
        }
    }
    getCommentID() {
        return this.getElementOfType("Article").comment;
    }
    setCommentID(cid) {
        this.getElementOfType("Article").comment = cid;
    }
}


export default class JSONDocument extends GenericLDJsonDocument {
    constructor(article) {
        super(article);
        this.contentBlocks = [];
        this.mentions = [];
        this.comment = '';
        this.order = 0;
    }
    _createMetadata(name) {
        return Immutable.List(name.split('').map(e => CharacterMetadata.create()));
    }
    _parseArticlePart(subArticle, processUrl) {
        let articleText = '';
        let name = subArticle.name;
        if (name === undefined) { // in case of SocialMediaPosting use headline
            name = subArticle.headline;
        }

        if (this.name) {
            this.order++;
        }
        this.contentBlocks.push(new ContentBlock([
            ['text', name],
            ['key', keyGen()],
            ['characterList', this._createMetadata(name)],
            ['type', 'header-two']
        ]));
        if (subArticle.articleBody) {
            subArticle.articleBody.forEach((paragraph, i) => {
                articleText += paragraph;
            });
        }
        if (processUrl && subArticle.url) {
            articleText += subArticle.url;
        }
        if (articleText !== '') {
            this.contentBlocks.push(new ContentBlock([
                ['text', articleText],
                ['key', keyGen()],
                ['characterList', this._createMetadata(articleText)],
                ['type', 'unstyled']
            ]));
        }
    }
    toDraft() {
        this.order = 0;
        let article = this.getElementOfType("Article");
        this.mentions = article.mentions ? extractMentions(article.mentions) : [];
        this.comment = article.comment;
        this._parseArticlePart(article,false);
        article.hasPart.forEach(subarticle => this._parseArticlePart(subarticle, true));
    }
    draftToJson(contentState) {
        let blockMap = contentState.getBlockMap(),
            firstBlock = blockMap.first(),
            lastBlock = blockMap.last(),
            part;
        let article = this.getElementOfType('Article');
        article.articleBody = [];
        article.hasPart = [];
        article.mentions = [];
        article.name = firstBlock.getText();
        let isPart = false;
        blockMap.forEach((e, i) => {
            if (i !== firstBlock.getKey()) {
                if (isPart) {
                    if (e.getType() !== 'header-two') {
                        part.articleBody.push(e.getText());
                        if (i === lastBlock.getKey()) {
                            article.hasPart.push(part);
                        }
                    } else {
                        article.hasPart.push(part);
                        part = getPart(e.getText());
                    }
                } else {
                    if (e.getType() !== 'header-two') {
                        article.articleBody.push(e.getText());
                    } else {
                        isPart = true;
                        part = getPart(e.getText());
                    }
                }
            }
        });
        blockMap.toArray().forEach((block, i) => {
            let entity;
            block.findEntityRanges(char => {
                let entityKey = char.getEntity();
                entity = !!entityKey ? Entity.get(entityKey) : null;
                return !!entity && entity.getType() === 'LINK';
            }, (anchorOffset, focusOffset) => {
                if (entity) {
                    let data = entity.getData();
                    let url = data.linkUrl,
                        name = data.linkTitle || '',
                        desc = data.linkDesc || '';
                    article.mentions.push(
                        getMention(name, "", `${url}?'${block.getText().substring(anchorOffset, focusOffset)}':${i},${anchorOffset}`)
                    );
                }
            });
        });
    }
    draftToHtml(contentState, author, commentID) {
        return new Promise((resolve, reject) => {
            contentState = contentState || {};
            this.draftToJson(contentState);
            var article = this.getElementOfType("Article");
            article.comment = commentID;
            resolve({
                    html: this.toHtml(),
                    json: this.jsonBlocks
                });
        });
    }
    toHtml() {
        var scrStart = '<script type="application/ld+json">';
        var scrEnd = '</script>';
        var scripts = "";
        this.jsonBlocks.forEach((item) => {
            scripts +=  scrStart + JSON.stringify(item) + scrEnd + '\n';
        });
        return cleshe.replace('|BODY|',scripts).replace('|TITLE|', this.getElementOfType('Article').name);
    }
}