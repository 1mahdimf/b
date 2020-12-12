var request = require('request');

var headers = {
    'Accept': 'application/json, text/plain, */*',
    'Referer': 'https://d.easytrader.emofid.com/',
    'Origin': 'https://d.easytrader.emofid.com',
    'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36',
    'Content-Type': 'application/json'
};

var dataString = '{"isins":["iro1fkhz0001","iro1ltos0001","iro1mrgn0001","iro1tamn0001","iro1tmlt0001","iro3stiz0001"]}';

var options = {
    url: 'https://d11.emofid.com/easy/api/MarketData/GetDPortfolioData',
    method: 'POST',
    headers: headers,
    body: dataString
};

function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
        console.log(body);
    }
}

request(options, callback);

