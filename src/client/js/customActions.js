import {Entity} from 'draft-js';
import JSONDocument from './JSONDocument.js';

var doc = new JSONDocument();


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
    doc.draftToHtml(editorState.getCurrentContent(), author,commentID).then(res => {
        let {json, html} = res;

        $.ajax({
                url: "https://storage." + domain + "/api/save",
                type: 'post',
                'dataType': 'json',
                data: {
                    'url': saveRelativePath,
                    'bodyData': html
                },
                xhrFields: {
                    withCredentials: true
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

    doc.draftToHtml(editorState.getCurrentContent(), author, commentID).then(res => {
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
const destroyClickedLink = (event) => {
    document.body.removeChild(event.target);
};
