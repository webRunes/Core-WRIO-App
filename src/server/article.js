import cheerio from 'cheerio';
import http from 'http';

export function getArticle(unformattedUrl, callback) {
    var url = unformattedUrl ? formatUrl(unformattedUrl) : '';
    
    getHtml(url, (err, data) => {
        if (err) {
            return callback(err, null);
        }
        
        var $ = cheerio.load(data);
        var scripts = $('script[type="application/ld+json"]');
        
        var article = scripts.map((index, script) => {
            var data = script.children[0].data;
            return JSON.parse(data);
        }).filter((index, json) => 
            json['@type'] == 'Article')[0];
        
        return callback(null, article);
    });
}

function getHtml(url, callback, cycles) {
    var data = '';
    var req = http.get(url, res => {
        if (res.statusCode == 302) {
            console.log('Responce code from server: 302. Resending request');
            var cycles = cycles ? cycles + 1 : 1;
            if (cycles <= 5) {
                return getHtml(url, callback, cycles);
            }
        }
        res.on('data', chunk => data += chunk);
        res.on('end', () => callback(null, data));
    });
    
    req.on('error', err => callback(err, null));
}

function formatUrl(url) {
    var splittedUrl = url.split('://');
    var host;
    var path;
    if (splittedUrl.length == 2) {
        host = splittedUrl[0];
        path = splittedUrl[1];
    } else {
        host = 'http';
        path = url;
    }
     
    var splittedPath = path.split('/');
    var lastNode = splittedPath[splittedPath.length - 1];
    if (splittedPath.length > 1 && lastNode) {
        if (!endsWith(lastNode, '.htm') && !endsWith(lastNode, '.html')) {
            path += '/'; 
        }
    } else if (splittedPath.length == 1) {
        path += '/';
    }
    var resultUrl = host + '://' + path;
    
    return resultUrl;
}

function endsWith(string, suffix) {
    return string.indexOf(suffix, string.length - suffix.length) !== -1;
}