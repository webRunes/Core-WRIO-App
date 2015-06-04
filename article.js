var cheerio = require('cheerio');
var http = require('http');

exports.getArticle = function(startUrl, callback) {
    var url = startUrl ? addHttp(startUrl) : '';
    
    getHtml(url, function(err, data) {
        if (err) {
            return callback(err, null);
        }
        
        var $ = cheerio.load(data);
        var scripts = $('script[type="application/ld+json"]');
        
        var article = scripts.map(function(index, script) {
            var data = script.children[0].data;
            return JSON.parse(data);
        }).filter(function(index, json) {
            return json['@type'] == 'Article';
        })[0];
        
        return callback(null, article);
    });
};

function getHtml(url, callback) {
    var data = '';
    var req = http.get(url, function(res) {
        res.on('data', function(chunk) {
            data += chunk;
        });
     
        res.on('end', function() {
            return callback(null, data);
        });
    });
    
    req.on('error', function(err) {
        return callback(err, null);
    });
}

function addHttp(url) {
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