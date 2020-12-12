const request = require('request');

let headers = {
	authority: 'onlineplus.mofidonline.com',
	'sec-fetch-dest': 'empty',
	'x-requested-with': 'XMLHttpRequest',
	'user-agent':
		'Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36',
	'content-type': 'application/json',
	accept: '*/*',
	origin: 'https://onlineplus.mofidonline.com',
	'sec-fetch-site': 'same-origin',
	'sec-fetch-mode': 'cors',
	referer: 'https://onlineplus.mofidonline.com/Home/Default/page-1',
	'accept-language': 'en-US,en;q=0.9,fa;q=0.8',
	cookie:
		'UserHasReadedHelp=true; _ga=GA1.2.453850385.1564251849; silverse=405xqj5hbnqhxx3rj5a2zusp; .ASPXAUTH=5B4E3033D0580D46AA2FA7BEB2BF074C6F15EC786F66F2A9A2AE607ED3DE1A8C0F5AB543BD0CDF24D442797A38B871B3B4625AFB64BA3A21D427879C66FCD3BF22D1F6B349AFCF40E04FF675616B97C773A0E64CD2C2212E749349CF6E2DE8B48ECDFD3B065F319CC590F0E14AC7680A08957331E6613534961AA08D8BF36194; Token=d069f86d-9379-4720-958d-4e14df0f112d; GuidedTourVersion=1; _gid=GA1.2.1775704532.1582701452; SiteVersion=3.7.4',
};

exports.setHeaders = value => {
	headers = { ...headers, ...value };
};

/**
	IsSymbolCautionAgreement: false
	CautionAgreementSelected: false
	IsSymbolSepahAgreement: false
	SepahAgreementSelected: false
	orderCount: 35
	orderPrice: 55592
	FinancialProviderId: 1
	minimumQuantity: ""
	maxShow: 0
	orderId: 0
	isin: "IRO3CHPZ0001"
	orderSide: 65
	orderValidity: 74
	orderValiditydate: null
	shortSellIsEnabled: false
	shortSellIncentivePercent: 0
 */
exports.sendOrderApi = (isin, orderCount, orderPrice, type = 'buy') => {
	return new Promise((resolve, reject) => {
		let bodyData = {
			isin,
			orderCount,
			orderPrice,
			IsSymbolCautionAgreement: false,
			CautionAgreementSelected: false,
			IsSymbolSepahAgreement: false,
			SepahAgreementSelected: false,
			minimumQuantity: '',
			maxShow: 0,
			orderId: 0,
			orderValiditydate: null,
			shortSellIsEnabled: false,
			shortSellIncentivePercent: 0,
			FinancialProviderId: 1, // TBRFinancialDataProvider: 1
			orderValidity: 74, // Day: 74, Week: 7, Month: 30, ValidToDate: 68, ExecuteAndRemove: 69, ValidToCancellation: 70
			orderSide: type === 'buy' ? 65 : 1, // buy: 65, sell: ?
		};

		const options = {
			url: 'https://onlineplus.mofidonline.com/Customer/SendOrder',
			method: 'POST',
			headers,
			body: JSON.stringify(bodyData),
			timeout: 30000, // ms
		};

		request(options, (error, res, body) => {
			if (!error && res.statusCode == 200) {
				resolve({ body: JSON.parse(body), bodyData });
			} else {
				reject({ url: options.url, error, statusCode: res ? res.statusCode : 0 });
			}
		});
	});
};

exports.getRemainPriceApi = () => {
	return new Promise((resolve, reject) => {
		const options = {
			url: 'https://onlineplus.mofidonline.com/Handlers/GetAccountRemain.ashx',
			method: 'GET',
			headers,
			timeout: 10000, // ms
		};

		request(options, (error, res, body) => {
			if (!error && res.statusCode == 200) {
				const data = JSON.parse(body).Data;
				resolve({
					realBalance: data.RealBalance,
					blockedBalance: data.BlockedBalance,
					accountBalance: data.AccountBalance,
				});
			} else {
				reject({ url: options.url, error, statusCode: res ? res.statusCode : 0 });
			}
		});
	});
};

exports.getStockInfo = isin => {
	return new Promise((resolve, reject) => {
		const options = {
			url: `https://core.tadbirrlc.com//StockFutureInfoHandler.ashx?%7B%22Type%22:%22getLightSymbolInfoAndQueue%22,%22la%22:%22Fa%22,%22nscCode%22:%22${isin}%22%7D&jsoncallback=`,
			method: 'GET',
			headers,
			timeout: 10000, // ms
		};

		request(options, (error, res, body) => {
			if (!error && res.statusCode == 200) {
				const data = JSON.parse(body).symbolinfo;
				resolve({ closingPrice: data.cp, maxPercentChange: data.mp });
			} else {
				reject({ url: options.url, error, statusCode: res ? res.statusCode : 0 });
			}
		});
	});
};

exports.referenceKeyGenerator = () => {
	var e = new Date().getTime();
	return (
		'undefined' != typeof performance && 'function' == typeof performance.now && (e += performance.now()),
		'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(t) {
			var n = (e + 16 * Math.random()) % 16 | 0;
			return (e = Math.floor(e / 16)), ('x' === t ? n : (3 & n) | 8).toString(16);
		})
	);
};
