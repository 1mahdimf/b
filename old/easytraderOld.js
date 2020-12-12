const moment = require('jalali-moment');
const fs = require('fs');

const { getObjectRedis } = require('./helpers/redis');
const { getRemainPriceApi, referenceKeyGenerator, sendOrderApi, setHeaders } = require('./helpers/EasytraderApi');
const { config } = require('./config');

const timer = ms => {
	return new Promise(res => setTimeout(res, ms));
};
const log = (text, fractionalSeconds = false) => {
	fs.appendFileSync(
		'./logs/easytrader.log',
		`${moment().format(`YYYY-MM-DD HH:mm:ss${fractionalSeconds ? ' SSS' : ''}`)} - ${text}\r\n`
	);
};

const main = async () => {
	try {
		const startTimeMoment = moment(`${moment().format('YYYY-MM-DD')} ${config.startTime}`, 'YYYY-MM-DD HH:mm:ss');
		const endTimeMoment = moment(`${moment().format('YYYY-MM-DD')} ${config.endTime}`, 'YYYY-MM-DD HH:mm:ss');

		const tokens = await getObjectRedis('tokens');

		const foundToken = tokens.find(token => token.type === 'easytrader' && token.user === config.easytrader_user);
		setHeaders(foundToken.headers);

		const credit = await getRemainPriceApi();
		console.log('credit', credit);
		// process.exit(1);

		if (credit && credit.accountBalance && credit.accountBalance >= 1000000) {
			const prices = await getObjectRedis('price');

			if (prices) {
				const price = prices.priceHigh;

				const newCredit = credit.accountBalance - Math.ceil(credit.accountBalance * 0.00462);
				const quantity = Math.floor(newCredit / price);
				// const quantity = config.buyQuantity;

				console.log(config.isin, quantity, price);
				// process.exit(1);
				log(
					`credit: ${credit.accountBalance} - isin: ${config.isin} - quantity: ${quantity} - price: ${price}`
				);

				while (true) {
					if (moment().isBetween(startTimeMoment, endTimeMoment)) {
						const referenceKey = referenceKeyGenerator();
						log(`TIME SEND ORDER - ${referenceKey}`, true);

						sendOrderApi(config.isin, quantity, price, referenceKey, 'buy')
							.then(({ body, bodyData }) => {
								log(`BODY ORDER: ${JSON.stringify(bodyData)}`, true);
								log(`SEND ORDER: ${JSON.stringify(body)}`, true);
								console.log(bodyData, body);
							})
							.catch(e => {
								log(`CATCH: ${referenceKey} - ${JSON.stringify(e)}`);
								console.log(e);
							});
					} else {
						console.log('OUT OF TIME', moment().format('HH:mm:ss'));
					}

					await timer(config.delay);
				}
			} else {
				log(`ERROR PRICE`);
				console.log('ERROR PRICE');
			}
		} else {
			log(`ERROR CREDIT: ${JSON.stringify(credit)}`);
			console.log('ERROR CREDIT', credit);
		}
	} catch (e) {
		log(`CATCH: ${JSON.stringify(e)}`);
		console.log(e);
	}
};

main();
