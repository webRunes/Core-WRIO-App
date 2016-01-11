import 'babel-polyfill';
import mongodb from 'mongodb';

export function mongo(args) {
	var args = args || {},
		url = args.url || '';
	return new Promise((resolve, reject) => {
		mongodb.MongoClient.connect(url, (err, db) => {
			if (err) {
				reject({
					code: err.code,
					message: err.message
				});
			} else {
				resolve({
					db: db
				});
			}
		});
	});
};

var obj = {
	mongo: mongo
};

export default obj;
