/**
 * Created by michbil on 10.05.16.
 */

import request from 'superagent';
var domain = process.env.DOMAIN;

export function saveToS3(path,html) {
    return new Promise((resolve,reject) => {
        request
            .post(`//storage.${domain}/api/save`)
            .withCredentials()
            .set('Accept', 'application/json')
            .send({
                'url': path,
                'bodyData': html
            })
            .then(({body})=> {
                resolve(body);
            }, (err)=> {
                reject(err);
            });
    });
}

export function getWidgetID(url) {
    return new Promise((resolve,reject) => {
        request
            .get(`//titter.${domain}/obtain_widget_id?query=${url}`)
            .withCredentials()
            .then(({body})=> {
                resolve(body);
            }, (err)=> {
                reject(err);
            });
    });
};

export function getRegistredUser() {
    return new Promise((resolve,reject) => {
        request
            .get(`//login.${domain}/api/get_profile`)
            .withCredentials()
            .then(({body})=> {
                console.log("Get_profile finish", body);
                resolve(body.id);
            }, (err)=> {
                reject(err);
            });
    });
}

export function extractFileName(pathname) {
    var fileName = pathname.match(/\/[0-9]+\/(.*)/);
    var out;
    if (fileName) {
        out = fileName[1];
        if (out === "" || !out) {
            out = "index.html"; // if no file specified, let's assume this is index.htm
        }
        return out;
    }
}

export function parseUrl(href) {
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

export function appendIndex(url) {
    var parsedUrl = parseUrl(url);
    var posturl = parsedUrl.pathname;
    var filename = posturl.substring(posturl.lastIndexOf('/')+1);
    if (filename == "") {
        return url + "index.html";
    }
    return url;
}
