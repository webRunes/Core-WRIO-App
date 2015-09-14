import nconf from './server/wrio_nconf';
import express from 'express';
import path from 'path';
import {
	getArticle
}
from './server/article';
import wrioLogin from './server/wriologin';
import ejs from 'ejs';
import session from 'express-session';
import db from './server/db';
import cookieParser from 'cookie-parser';

var app = express();

var DOMAIN = nconf.get('db:workdomain');
app.set('views', __dirname + '/client/views');

app.engine('htm', ejs.renderFile);

import _SessionStore from 'connect-mongo';
var SessionStore = _SessionStore(session);
var cookie_secret = nconf.get("server:cookiesecret");
app.use(cookieParser(cookie_secret));

app.use('/assets', express.static(path.join(__dirname, '/client')));

var mongoUrl = 'mongodb://' + nconf.get('mongo:user') + ':' + nconf.get('mongo:password') + '@' + nconf.get('mongo:host') + '/' + nconf.get('mongo:dbname');

db.mongo({
		url: mongoUrl
	})
	.then(function(res) {
		console.log("Connected correctly to database");
		var db = res.db || {};
		var server = require('http')
			.createServer(app)
			.listen(nconf.get("server:port"), function(req, res) {
				console.log('app listening on port ' + nconf.get('server:port') + '...');
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
				wrioLogin.setDB(db);
				app.get('/', function(request, response) {
					var render;
					if (request.query.create === '') {
						render = 'core.ejs';
						getArticle(request.query.edit, function(err, article) {
							if (err) {
								console.log("Got error: " + err.message);
								return response.render(render, {
									article: null
								});
							}

							response.render(render, {
								article: article
							});
						});
					} else {
						render = '../index.htm';
						wrioLogin.loginWithSessionId(request.sessionID, function(err, res) {
							if (err) {
								console.log("User not found:", err);
								response.render(render, {
									"error": "Not logged in",
									"user": undefined
								});
							} else {
								response.render(render, {
									"user": res
								});
								console.log("User found " + res);
							}
						})
					}
				});
				console.log("Application Started!");
			});
	})
	.catch(function(err) {
		console.log('Error connect to database:' + err.code + ': ' + err.message);
	});
