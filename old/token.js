const { getObjectRedis } = require('./helpers/redis');

const main = async () => {
	try {
		const tokens = await getObjectRedis('tokens');
		console.log('tokens', tokens);
	} catch (e) {
		console.log('error', e);
	}
};

main();

