const moment = require('jalali-moment');

const { delay, log, referenceKeyGenerator } = require('./helpers/index');
const { getObjectRedis } = require('./helpers/redis');
const { config } = require('./config');

const OnlineplusApiMulti = require('./helpers/OnlineplusApiMulti');

const main = async () => {
	try {
		const startTimeMoment = moment(`${moment().format('YYYY-MM-DD')} ${config.startTime}`, 'YYYY-MM-DD HH:mm:ss');
		const endTimeMoment = moment(`${moment().format('YYYY-MM-DD')} ${config.endTime}`, 'YYYY-MM-DD HH:mm:ss');

		const requests = await initRequests();

		while (true) {
			if (moment().isBetween(startTimeMoment, endTimeMoment)) {
				Object.keys(requests).forEach(user => {
					const request = requests[user];

					const referenceKey = referenceKeyGenerator();
					log('onlineplus-multi', `TIME SEND ORDER - ${user} - ${referenceKey}`, true);

					request
						.sendOrderApi(referenceKey)
						.then(({ body, number }) => {
							// log(
							// 	'onlineplus-multi',
							// 	`BODY ORDER: ${user} - ${referenceKey} - ${JSON.stringify(bodyData)}`,
							// 	true
							// );
							log('onlineplus-multi', `SEND ORDER: ${user} - ${number} - ${JSON.stringify(body)}`, true);
							console.log(body);
						})
						.catch(({ err, number }) => {
							log('onlineplus-multi', `CATCH: ${user} - ${number} - ${JSON.stringify(err)}`);
							console.log(err);
						});
				});
			} else {
				console.log('OUT OF TIME', moment().format('HH:mm:ss'));
			}

			await delay(config.delay);
		}
	} catch (e) {
		log('onlineplus-multi', `CATCH: ${JSON.stringify(e)}`);
		console.log(e);
	}
};

const initRequests = async () => {
	return new Promise(async (resolve, reject) => {
		const tokens = await getObjectRedis('tokens');
		const prices = await getObjectRedis('prices');

		if (!tokens || !prices) return reject('ERROR token or prices');

		const requestsApi = {};
		config.onlineplus_requests.forEach(async (request, index) => {
			const foundToken = tokens.find(token => token.type === 'onlineplus' && token.user === request.user);

			if (foundToken) {
				requestsApi[request.user] = new OnlineplusApiMulti();
				requestsApi[request.user].setHeaders(foundToken.headers);

				requestsApi[request.user].isin = request.isin;
				requestsApi[request.user].orderType = request.orderType;

				const credit = await requestsApi[request.user].getRemainPriceApi();

				if (credit && credit.accountBalance && credit.accountBalance >= 1000000) {
					const priceIsin = prices.list[request.isin];
					if (priceIsin) {
						const price = request.orderType === 'buy' ? priceIsin.priceHigh : priceIsin.priceLow;
						requestsApi[request.user].price = price;

						const newCredit = credit.accountBalance - Math.ceil(credit.accountBalance * 0.00462);
						const quantity = Math.floor(newCredit / requestsApi[request.user].price);
						requestsApi[request.user].quantity = quantity;

						console.log('request', request.user, requestsApi[request.user]);
						log(
							'onlineplus-multi',
							`user: ${request.user} - credit: ${credit.accountBalance} - isin: ${request.isin} - quantity: ${quantity} - price: ${price}`
						);

						// last item
						if (config.onlineplus_requests.length === index + 1) {
							return resolve(requestsApi);
						}
					} else {
						log('onlineplus-multi', `ERROR PRICE`);
						console.log('ERROR PRICE');
					}
				} else {
					log('onlineplus-multi', `ERROR CREDIT: ${JSON.stringify(credit)}`);
					console.log('ERROR CREDIT', credit);
				}
			} else {
				// last item
				if (config.onlineplus_requests.length === index + 1) {
					return resolve(requestsApi);
				}
			}
		});
	});
};

main();
