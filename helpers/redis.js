const redis = require('redis');
const client = redis.createClient();

client.on('error', error => {
	console.error('REDIS ERROR', error);
});

const setRedis = (key, value) => {
	return new Promise((resolve, reject) => {
		client.set(key, value, err => {
			if (err) return reject(err);
			return resolve();
		});
	});
};
exports.setRedis = setRedis;

exports.setObjectRedis = (key, value) => {
	return new Promise((resolve, reject) => {
		setRedis(key, JSON.stringify(value))
			.then(resolve)
			.catch(reject);
	});
};

exports.hmsetRedis = (key, values) => {
	return new Promise((resolve, reject) => {
		client.hmset(key, values, err => {
			if (err) return reject(err);
			return resolve();
		});
	});
};

const getRedis = key => {
	return new Promise((resolve, reject) => {
		client.get(key, (err, reply) => {
			if (err) return reject(err);
			return resolve(reply);
		});
	});
};
exports.getRedis = getRedis;

exports.getObjectRedis = key => {
	return new Promise((resolve, reject) => {
		getRedis(key)
			.then(value => resolve(JSON.parse(value)))
			.catch(reject);
	});
};

