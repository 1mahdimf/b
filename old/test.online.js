var request = require('request');

var headers = {
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
		'UserHasReadedHelp=true; _ga=GA1.2.453850385.1564251849; GuidedTourVersion=1; SiteVersion=3.7.4; silverse=z5tl1yryujjqyxujpeqqim33; lastmessage-6=1; lastmessage-2=1; _gid=GA1.2.87692316.1582959723; .ASPXAUTH=E9A4B3C9E439F2C98423400322C11DE7C3D63315DB7012C3C31FEBF42A759B403B881E13EC5BFA6B6B75A48CDD7193ECC5248A1D509E8799F29DC454B028B3E607C73B1375F64ED20718B8A2655992382609BDA13F19158669D93453BC3C0B4B306FBD8A54D937BE49E1DF6578BFA8C0BB006DBDB7C44547D2786CDDFC41F4EA; Token=6e09ab51-8478-4a5e-b087-e05d925d915c',
};

var dataString = {
	IsSymbolCautionAgreement: false,
	CautionAgreementSelected: false,
	IsSymbolSepahAgreement: false,
	SepahAgreementSelected: false,
	orderCount: 8889,
	orderPrice: 22603,
	FinancialProviderId: 1,
	minimumQuantity: '',
	maxShow: 0,
	orderId: 0,
	isin: 'IRO1GARN0001',
	orderSide: 65,
	orderValidity: 74,
	orderValiditydate: null,
	shortSellIsEnabled: false,
	shortSellIncentivePercent: 0,
};

var options = {
	url: 'https://onlineplus.mofidonline.com/Customer/SendOrder',
	method: 'POST',
	headers: headers,
	body: JSON.stringify(dataString),
};

function callback(error, response, body) {
	if (!error && response.statusCode == 200) {
		console.log(body);
	}
}

request(options, callback);

