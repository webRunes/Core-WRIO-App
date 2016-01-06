import nconf from './server/wrio_nconf';
import express from 'express';
import path from 'path';
import {
	getArticle
}
from './server/article';
import fs from 'fs';
import ejs from 'ejs';
import session from 'express-session';
import db from './server/db';
import cookieParser from 'cookie-parser';

var app = express();

var DOMAIN = nconf.get('db:workdomain');
app.set('views', __dirname + '/client/views');
app.set('view engine', 'ejs');

import _SessionStore from 'connect-mongo';
var SessionStore = _SessionStore(session);
var cookie_secret = nconf.get("server:cookiesecret");
app.use(cookieParser(cookie_secret));

app.use('/assets', express.static(path.join(__dirname, '/client')));

var mongoUrl = 'mongodb://' + nconf.get('mongo:user') + ':' + nconf.get('mongo:password') + '@' + nconf.get('mongo:host') + '/' + nconf.get('mongo:dbname');

db.mongo({
		url: mongoUrl
	})
	.then((res) => {
		console.log("Connected correctly to database");
		var db = res.db || {};
		var server = require('http')
			.createServer(app)
			.listen(nconf.get("server:port"), (req, res) => {
				console.log('app listening on port ' + nconf.get('server:port') + '...');
				server_setup(db);
				console.log("Application Started!");
			});
	})
	.catch((err) => {
		console.log('Error connect to database:' + err.code + ': ' + err.message);
	});

function server_setup(db) {
	var sessionStore = new SessionStore({
		db: db
	});
	app.use(session({

		secret: cookie_secret,
		saveUninitialized: true,
		store: sessionStore,
		resave: true,
		cookie: {
			secure: false,
			domain: DOMAIN,
			maxAge: 1000 * 60 * 60 * 24 * 30
		},
		key: 'sid'
	}));
	app.get('/', (request, response) => {
		response.sendFile(__dirname + '/static/index.htm');
	});

	app.get('/create', (request, response) => {
		response.sendFile(__dirname +
			'/client/views/core.htm');
	});

	app.get('/edit', (request, response) => {
		response.sendFile(__dirname +
			'/client/views/core.htm');
	});

}
