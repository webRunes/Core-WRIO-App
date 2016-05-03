import {Entity} from 'draft-js';

export default class CustomActions {

    static toggleCustomAction(editorState, action, saveRelativePath, author,commentID) {
        switch (action) {
            case 'save':
                saveAction(editorState, author, saveRelativePath,commentID);
                break;
            case 'saveas':
                saveAsAction(editorState, author,commentID);
                break;
            default:
                console.log('Invalid action');
        }
    };

};

var domain = process.env.DOMAIN;

const saveAction = (editorState, author, saveRelativePath, commentID) => {
    console.log('save_action');
    toJSON(editorState.getCurrentContent(), author,commentID).then(res => {
        let {json, html} = res;

        $.ajax({
                url: "https://storage." + domain + "/api/save",
                type: 'post',
                'dataType': 'json',
                data: {
                    'url': saveRelativePath,
                    'bodyData': html
                }
            })
            .success((res) => {
                parent.postMessage(JSON.stringify({
                    "coreSaved": true
                }), "*");
            }).error(err => {
                console.log(err);
            });

    });
};

const saveAsAction = (editorState, author,commentID) => {
    console.log('save_as_action');
    toJSON(editorState.getCurrentContent(), author, commentID).then(res => {
        let {json, html} = res,
        ie = navigator.userAgent.match(/MSIE\s([\d.]+)/),
            ie11 = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/),
            ieEDGE = navigator.userAgent.match(/Edge/g),
            ieVer = (ie ? parseInt(ie[1]) : (ie11 ? 11 : -1));

        let fileName = (json.name === '' ? 'untitled' : json.name.split(' ').join('_')) + '.htm';

        if (ie || ie11 || ieEDGE) {
            if (ieVer > 9 || ieEDGE) {
                var textFileAsBlob = new Blob([html], {
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
            textFileAsBlob = new Blob([html], {
                type: 'text/plain'
            });
            downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
            downloadLink.onclick = destroyClickedLink.bind(this);
            downloadLink.style.display = "none";
            document.body.appendChild(downloadLink);

            downloadLink.click();
        }
    });
};

const toJSON = (contentState, author,commentID) => {
    return new Promise((resolve, reject) => {
        contentState = contentState || {};
        let json = getArticle("en-US", "", author, commentID),
            blockMap = contentState.getBlockMap(),
            firstBlock = blockMap.first(),
            lastBlock = blockMap.last(),
            part,
            cleshe = '<!DOCTYPE html><html lang="en-US"><head><meta charset="utf-8">' +
            '<meta http-equiv="X-UA-Compatible" content="IE=edge"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
            '<noscript><meta http-equiv="refresh" content="0; URL=//wrioos.com/no_jscript.htm"></noscript>' +
            '<meta name="description" content=""><meta name="author" content=""><meta name="keywords" content="">' +
            '<title>|TITLE|</title><script type="application/ld+json">|BODY|</script>' +
            '</head><body><script type="text/javascript" src="//wrioos.com/start.js"></script></body></html>';

        json.name = firstBlock.getText();
        let isPart;
        blockMap.forEach((e, i) => {
            if (i) {
                if (isPart) {
                    if (e.getType() !== 'header-two') {
                        part.articleBody.push(e.getText());
                        if (i === lastBlock.getKey()) {
                            json.hasPart.push(part);
                        }
                    } else {
                        json.hasPart.push(part);
                        part = getPart(e.getText());
                    }
                } else {
                    if (e.getType() !== 'header-two') {
                        json.articleBody.push(e.getText());
                    } else {
                        isPart = 1;
                        part = getPart(e.getText());
                    }
                }
            }
        });

        blockMap.toArray().forEach((block, i) => {
            let entity;
            console.log(i);
            block.findEntityRanges(char => {
                let entityKey = char.getEntity();
                entity = !!entityKey ? Entity.get(entityKey) : null;
                return !!entity && entity.getType() === 'LINK';
            }, (anchorOffset, focusOffset) => {
                if (entity) {
                    json.mentions.push(
                        getMention("", "", `${entity.getData().url}?'${block.getText().substring(anchorOffset, focusOffset)}':${i},${anchorOffset}`)
                    );
                }
            });
        });

        resolve({
            html: cleshe.replace('|BODY|', JSON.stringify(json)).replace('|TITLE|', json.name),
            json: json
        });
    });
};

const getArticle = (lang, keywords, author, widgetData) => {
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

const destroyClickedLink = (event) => {
    document.body.removeChild(event.target);
};
