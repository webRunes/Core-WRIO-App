import nconf from './server/wrio_nconf';
import express from 'express';
import path from 'path';
import {getArticle} from './server/article';

var app = express();

app.set('views', __dirname + '/client/views');
app.set('view engine', 'ejs');

app.use('/assets', express.static(path.join(__dirname, '/client')));

app.get('/', function (request, response) {
    getArticle(request.query.edit, function(err, article) {
        if (err) {
            console.log("Got error: " + err.message);
            return response.render('core.ejs', { article: null });
        }
        
        response.render('core.ejs', { article: article });
    });
});

app.listen(nconf.get("server:port"));