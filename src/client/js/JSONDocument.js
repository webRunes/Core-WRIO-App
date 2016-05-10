/**
 * Created by michbil on 09.05.16.
 */

import {extractMentions} from './mentions/mention';
import Immutable from 'immutable';
import {ContentBlock, CharacterMetadata, Entity} from 'draft-js';

var cleshe = '<!DOCTYPE html><html lang="en-US"><head><meta charset="utf-8">' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<noscript><meta http-equiv="refresh" content="0; URL=//wrioos.com/no_jscript.html"></noscript>' +
    '<meta name="description" content=""><meta name="author" content=""><meta name="keywords" content="">' +
    '<title>|TITLE|</title><script type="application/ld+json">|BODY|</script>' +
    '</head><body><script type="text/javascript" src="//wrioos.com/start.js"></script></body></html>';

const keyGen = () => {
    return (new Date()).getTime().toString(32) + Math.random().toString(32);
};



const getPart = (name) => {
    return {
        "@type": "Article",
        "name": name,
        "articleBody": []
    };
};

const getMention = (name, about, link) => {
    return {
        "@type": "Article",
        "name": name,
        "about": about,
        "link": link
    };
};



export default class JSONDocument {

    constructor(article) {

        this.contentBlocks = new Array();
        this.mentions = [];
        this.comment = '';
        this.json = article || {};

    }


    _createMetadata(name) {
        return Immutable.List(name.split('').map(e => CharacterMetadata.create()));
    }

    _parseSubArticle(subArticle, processUrl) {
        var articleText = '';
        this.contentBlocks.push(new ContentBlock([
            ['text', subArticle.name],
            ['key', keyGen()],
            ['characterList', this._createMetadata(subArticle.name)],
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

        var article = this.json.filter((json) => json['@type'] == 'Article')[0];

        if (article.mentions) {
            this.mentions = extractMentions(article.mentions);
        } else {
            this.mentions = [];
        }

        this.comment = article.comment;

        this._parseSubArticle(article,false);
        article.hasPart.forEach(subarticle => this._parseSubArticle(subarticle, true));
    }

    draftToJson(contentState) {
        let blockMap = contentState.getBlockMap(),
            firstBlock = blockMap.first(),
            lastBlock = blockMap.last(),
            part;


        this.json.name = firstBlock.getText();
        let isPart = false;
        blockMap.forEach((e, i) => {
            if (i !== firstBlock.getKey()) {
                if (isPart) {
                    if (e.getType() !== 'header-two') {
                        part.articleBody.push(e.getText());
                        if (i === lastBlock.getKey()) {
                            this.json.hasPart.push(part);
                        }
                    } else {
                        this.json.hasPart.push(part);
                        part = getPart(e.getText());
                    }
                } else {
                    if (e.getType() !== 'header-two') {
                        this.json.articleBody.push(e.getText());
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
                    let _url = entity.getData().url.split('?'),
                        url = _url[0],
                        name = _url[1] || '';

                    this.json.mentions.push(
                        getMention(name, "", `${url}?'${block.getText().substring(anchorOffset, focusOffset)}':${i},${anchorOffset}`)
                    );
                }
            });
        });

    }


    draftToHtml(contentState, author, commentID) {
        return new Promise((resolve, reject) => {
            contentState = contentState || {};
            this.json = this.getArticle("en-US", "", author, commentID);
            this.draftToJson(contentState);

            resolve(this.toHtml());
        });
    }

    toHtml() {
        return {
            html: cleshe.replace('|BODY|', JSON.stringify(this.json)).replace('|TITLE|', this.json.name),
            json: this.json
        };
    }

    getArticle (lang, keywords, author, widgetData) {
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



}