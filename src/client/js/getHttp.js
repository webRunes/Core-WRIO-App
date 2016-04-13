/**
 * Created by michbil on 13.04.16.
 */
import request from 'superagent';
import {scripts} from './mentions/scripts.js';

function getScript(result) {
    var e = document.createElement('div');
    e.innerHTML = result.text;
    return scripts(e.getElementsByTagName('script'));
}

function fixUrlProtocol(url) {
    if (!url) {
        return;
    }
    var separatorPosition = url.indexOf('//');
    if (separatorPosition !== -1) {
        url = url.substring(separatorPosition + 2, url.length);
    }
    return '//' + url;
}

function tryCors(url,cb) {
    console.log("Trying to reach URL via CORS ",url);
    if (url.indexOf('?') >=0) {
        url = url.substring(0, url.indexOf('?'));
    }

    url = 'https://crossorigin.me/'+url;
    request.get(
        url,
        (err, result) => {
            if (!err && (typeof result === 'object')) {
                console.log("CORS proxy request succeeded");
                result = getScript(result);
                cb.call(this, result || []);
            } else {
                cb.call(this,null);
            }

        }
    );
}

// All http requests are made in 3 sequential steps, page is tried to be accessed with current // protocol,
// if failed - then with alternate protocol
// else trying

export default function getHttp (url, cb) {
    var strippedUrl = fixUrlProtocol(url);

    if (!url) {
        return console.log("Assertion, no url specified");
    }

    request.get(
        strippedUrl,
        (err, result) => {
            if (!err && (typeof result === 'object')) {
                result = getScript(result);
                cb.call(this, result || []);
            } else {
                getDifferentProtocol(url,cb);
            }

        }
    );
}

function alternateProtocol() {
    var currentProtocol = window.location.protocol;
    if (currentProtocol == "http:") {
        return "https:";
    }
    if (currentProtocol == "https:") {
        return "http:";
    }
    return "https:";
}

function getDifferentProtocol (url, cb) {
    var strippedUrl = alternateProtocol() + fixUrlProtocol(url);

    if (!url) {
        return console.log("Assertion, no url specified");
    }

    request.get(
        strippedUrl,
        (err, result) => {
            if (!err && (typeof result === 'object')) {
                result = getScript(result);
                cb.call(this, result || []);
            } else {
                tryCors(url,cb);
            }

        }
    );
}
