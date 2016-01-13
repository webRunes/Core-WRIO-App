import mongodb from 'mongodb';
import nconf from 'nconf'

export function mongo() {
	var url = "";
	var user = nconf.get('mongo:user');
	var password =  nconf.get('mongo:password');

	if (user) {
		url = 'mongodb://' + user + ':' + password + '@' + nconf.get('mongo:host') + '/' + nconf.get('mongo:dbname');
	} else {
		url = 'mongodb://' + nconf.get('mongo:host') + '/' + nconf.get('mongo:dbname');
	}

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
