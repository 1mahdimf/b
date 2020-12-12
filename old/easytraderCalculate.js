const { getObjectRedis } = require('./helpers/redis');
const { getRemainPriceApi, getStockInfo, setHeaders } = require('./helpers/EasytraderApi');
const { config } = require('./config');

const main = async () => {
	try {
		const tokens = await getObjectRedis('tokens');

		const easyToken = tokens.find(token => token.type === 'easytrader' && token.user === config.easytrader_user);
		setHeaders(easyToken.headers);

		const credit = await getRemainPriceApi();

		if (credit && credit.accountBalance && credit.accountBalance >= 1000000) {
			const details = await getStockInfo(config.isin);

			if (details.closingPrice && details.maxPercentChange) {
				const tomorrowThresholdHigh = Math.floor(details.closingPrice * (1 + details.maxPercentChange / 100));
				// const tomorrowThresholdLow = Math.ceil(details.closingPrice * (1 - details.maxPercentChange / 100));

				const price = tomorrowThresholdHigh;

				const newCredit = credit.accountBalance - Math.ceil(credit.accountBalance * 0.00462);
				const quantity = Math.floor(newCredit / price);

				console.log(config.isin, quantity, price, credit);
			}
		} else {
			console.log('ERROR CREDIT', credit);
		}
	} catch (e) {
		console.log(e);
	}
};

main();
