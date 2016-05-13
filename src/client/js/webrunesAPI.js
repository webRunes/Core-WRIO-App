/**
 * Created by michbil on 10.05.16.
 */

var domain = process.env.DOMAIN;

export function saveToS3(path,html) {
    return new Promise((resolve,reject) => {
        $.ajax({
            url: "//storage." + domain + "/api/save",
            type: 'post',
            'dataType': 'json',
            data: {
                'url': path,
                'bodyData': html
            },
            xhrFields: {
                withCredentials: true
            }
        })
            .success((res) => {
                resolve(res);
            }).error(err => {
                reject(err);
            });
    });
}

export function getWidgetID(url) {
    return new Promise((resolve,reject) => {
        $.ajax({
            url: "//titter." + domain + "/obtain_widget_id?query=" + url,
            type: 'get',
            xhrFields: {
                withCredentials: true
            }
        }).done((id, ts, jq) => {
            resolve(id);
        }).fail((e) => {
           reject(e);
        });
    });
};

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