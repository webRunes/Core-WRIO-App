/**
 * Created by michbil on 09.05.16.
 */

import {extractMentions} from './mentions/mention';
import Immutable from 'immutable';
import {ContentBlock, CharacterMetadata, Entity} from 'draft-js';


var cleshe = '<!DOCTYPE html><html><head><meta charset="utf-8">\n' +
    '<meta http-equiv="X-UA-Compatible" content="IE=edge">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '<noscript><meta http-equiv="refresh" content="0; URL=https://wrioos.com/no_jscript.html"></noscript>\n' +
    '<meta name="description" content="|DESCRIPTION|"><meta name="author" content="">\n<meta name="keywords" content="">\n' +
    '<title>|TITLE|</title>\n|BODY|' +
    '</head>\n<body>\n<script type="text/javascript" src="https://wrioos.com/start.js">\n</script>\n</body></html>\n';

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
        "url": link
    });


class GenericLDJsonDocument {
    constructor(article = []) {
        this.jsonBlocks = article;
    }

    /**
     * Returns LD+JSON entity of type <type>
     * @param type
     * @returns {*}
     */
    getElementOfType(type) {
        var rv;
        this.jsonBlocks.forEach((element) => {
            if (element["@type"] === type) {
                rv = element;
            }
        });
        return rv;
    }

    /**
     * Make new article skeleton
     * @param lang - article language
     * @param keywords - keywords list
     * @param author - author WRIO id
     * @param widgetData - commentID for the article
     * @param about - description for the article
     * @returns LD+JSON template
     */

    makeArticle(lang, keywords, author, widgetData,about) {
        return {
            "@context": "http://schema.org",
            "@type": "Article",
            "inLanguage": lang,
            "keywords": keywords,
            "author": `https://wr.io/${author}/?wr.io=${author}`,
            "editor": "",
            "name": "Untitled",
            "about": about,
            "articleBody": [" "],
            "hasPart": [],
            "mentions": [],
            "comment": widgetData
        };
    };
    /**
     * Wrapper for makeArticle
     * @param author
     * @param commentID
     * @param about
     */
    createArticle(author,commentID,about) {
        if (this.getElementOfType("Article")) {
            console.log("Failed to create article, it already exists");
        } else {
            this.jsonBlocks.push(this.makeArticle("En", "", author, commentID,about));
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

    /**
     * Parse individual json part
     * @param subArticle - input json
     * @param processUrl - url flag
     * @returns {Array} of ContentBlocks
     * @private
     */

    _parseArticlePart(subArticle, processUrl) {
        let articleText = '';
        let res = [];
        let name = subArticle.name;
        if (name === undefined) { // in case of SocialMediaPosting use headline
            name = subArticle.headline;
        }

        if (this.name) {
            this.order++;
        }
        res.push(new ContentBlock([
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
            res.push(new ContentBlock([
                ['text', articleText],
                ['key', keyGen()],
                ['characterList', this._createMetadata(articleText)],
                ['type', 'unstyled']
            ]));
        }
        return res;
    }

    /**
     * Convert JSON representation to draftJS contentState
     * modifies this.contentBlocks
     */

    toDraft() {
        this.order = 0;
        let article = this.getElementOfType("Article");
        this.mentions = article.mentions ? extractMentions(article.mentions) : [];
        this.comment = article.comment;
        // parse article root
        this.contentBlocks = this._parseArticlePart(article,false);
        // and merge it with data from the hasPart section
        this.contentBlocks = this.contentBlocks.concat(this.contentBlocks, article.hasPart.reduce((r,subarticle) => {
            r = r.concat(r,this._parseArticlePart(subarticle, true));
            return r;
        },[]));
        return this.contentBlocks;
    }

    /**
     * Get first block(title) of the page
     * @param contentState
     * @returns {string} Title of the page
     */

    static getTitle(contentState) {
        const blockMap = contentState.getBlockMap(),
            firstBlock = blockMap.first();
        return firstBlock.getText();
    }

    /**
     * Converts current draftJS content state to LD+JSON representation
     * @param contentState
     */

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

        const formatMention = (url,text,blockIndex,offset) => `${url}?'${text}':${blockIndex},${offset}`;

        let order = 0;

        if (typeof article.name === "string") {
            order++;
        }
        if (typeof article.about === "string") {
            order++;
        }

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
                    const linkText = block.getText().substring(anchorOffset, focusOffset);
                    article.mentions.push(
                        getMention(name, "", formatMention(url,linkText,order+i,anchorOffset) )
                    );
                }
            });
        });
    }

    /**
     * Converts draftJS editor contents to
     * @param contentState - draftJS content state
     * @param author - author of the page
     * @param commentID - comment id
     * @returns {Promise} to the struct with html and json representation of the article
     */

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

    /**
     * Exports document to html text
     * @returns {string} text of the html document
     */

    toHtml() {
        var scrStart = '<script type="application/ld+json">';
        var scrEnd = '</script>';
        var scripts = "";
        this.jsonBlocks.forEach((item) => {
            scripts +=  scrStart + JSON.stringify(item,null," ") + scrEnd + '\n';
        });
        return cleshe.replace('|BODY|',scripts)
            .replace('|TITLE|', this.getElementOfType('Article').name)
            .replace('|DESCRIPTION|', this.getElementOfType('Article').about);
    }

    /**
     * sets current document description(about)
     * @param text - description text
     */

    setAbout(text) {
        let article = this.getElementOfType('Article');
        article.about=text;
    }
}