import {Entity} from 'draft-js';
import JSONDocument from './JSONDocument.js';
import {saveToS3} from './webrunesAPI.js';
import WrioActions from './actions/wrio.js';

export default class CustomActions {
    static toggleCustomAction(editorState, action, saveRelativePath, author,commentID, doc, description) {
        switch (action) {
            case 'save':
                saveAction(editorState, author, saveRelativePath,commentID, doc, description);
                break;
            case 'saveas':
                saveAsAction(editorState, author,commentID, doc, description);
                break;
            default:
                console.log('Invalid action');
        }
    }
};

var domain = process.env.DOMAIN;

const saveAction = (editorState, author, saveRelativePath, commentID,doc,description) => {
    doc.setAbout(description);
    doc.draftToHtml(editorState.getCurrentContent(), author,commentID).then(res => {
        let {json, html} = res;
        return saveToS3(saveRelativePath,html);
    }).then((res) => {
        WrioActions.busy(false);
        parent.postMessage(JSON.stringify({
            "coreSaved": true
        }), "*");
    }).catch((err)=> {
        WrioActions.busy(false);
        console.log(err);
    });
};

const saveAsAction = (editorState, author,commentID,doc, description) => {
    doc.setAbout(description);
    doc.draftToHtml(editorState.getCurrentContent(), author, commentID).then(res => {
        let json = doc.getElementOfType('Article');
        let html = res.html;
        let fileName = (json.name === '' ? 'untitled' : json.name.split(' ').join('_')) + '.html';
        saveAs(fileName,html);
        WrioActions.busy(false);
    });
};

const destroyClickedLink = (event) => {
    document.body.removeChild(event.target);
};

function saveAs(fileName,html) {
    let ie = navigator.userAgent.match(/MSIE\s([\d.]+)/),
        ie11 = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/),
        ieEDGE = navigator.userAgent.match(/Edge/g),
        ieVer = (ie ? parseInt(ie[1]) : (ie11 ? 11 : -1));
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
}