var nconf = require("./wrio_nconf.js").init();
var express = require('express');
var app = require("./wrio_app.js").init(express);
var server = require('http').createServer(app).listen(nconf.get("server:port"));
var article = require('./article');

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');


app.get('/', function (request, response) {
    article.getArticle(request.query.edit, function(err, article) {
        if (err) {
            console.log("Got error: " + err.message);
            return response.render('core.ejs', { article: null });
        }
        
        response.render('core.ejs', { article: article });
    });
});

