const express = require('express');
const path = require('path');
const fs =require('fs');
const ejs =require('ejs');
const session =require('express-session');
const cookieParser =require('cookie-parser');
const _SessionStore =require('connect-mongo');
const nconf = require('./server/wrio_nconf.js');

var app = express();
app.ready = () => {};

var DOMAIN = nconf.get('db:workdomain');
app.use('/', express.static(path.join(__dirname, '../hub')));

var server = require('http')
    .createServer(app)
    .listen(nconf.get("server:port"), (req, res) => {
        console.log('app listening on port ' + nconf.get('server:port') + '...');
        app.ready();
        console.log("Application Started!");
    });


app.get('/create', (request, response) => {
    response.sendFile(__dirname +
        '/client/views/core.html');
});

app.get('/edit', (request, response) => {
    response.sendFile(__dirname +
        '/client/views/core.html');
});

function setupDevServer () {
    console.log("Devserv start");
    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');

    let config = require('../webpack.config');
    config.output.filename = 'client.js'; //override output filename
    config.output.path = '/';
    const compiler = webpack(config);


    app.use(webpackDevMiddleware(compiler,{
        publicPath: "/assets/",
        stats: {colors: true},
        watchOptions: {
            aggregateTimeout: 300,
            poll: true
        }
    }));
}

if (nconf.get("db:workdomain") === '.wrioos.local') {
    setTimeout(() => console.log("Building in progress, sit tight... ☕ ☕ ☕"),2000);
    setupDevServer();
} else {
    console.log("Production hosting mode");
    app.use('/assets', express.static(path.join(__dirname, "..", './app/client')));
}

module.exports =  app;
