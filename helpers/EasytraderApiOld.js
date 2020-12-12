const request = require("request");
const moment = require("jalali-moment");

let headers = {
  Authorization: "Bearer eyJhb...",
  "content-type": "application/json; charset=UTF-8",
  accept: "application/json, text/plain, */*",
  "cache-control": "no-cache",
  referer: "https://d.easytrader.emofid.com/",
  "user-agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"
};

exports.setHeaders = value => {
  headers = { ...headers, ...value };
};

exports.endpointApi = () => {
  return new Promise((resolve, reject) => {
    const options = {
      url: "https://d11.emofid.com/endpoint/prod/",
      method: "GET",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

/**
[ { id: null,
    referenceKey: '29102dc9-2c42-4fa5-adf6-70fcc0a20e75',
    isin: 'IRO3CHPZ0001',
    price: 55592,
    quantity: 18,
    side: 0,
    easyState: 2,
    omsIsSuccessful: true,
    omsErrorDescription: null,
    omsOrderId: 2020022630077748,
    omsOrderState: 6,
    excutedAmount: 0,
    validityType: 74,
    validityDate: null,
    validityDateJalali: null,
    orderEntryDate: '2020-02-26T05:00:26.247Z',
    orderEntryDateJalali: '1398/12/07 08:30',
    parentId: null,
    iceberg: 0,
    financeId: 1,
    hostOrderId: 4846,
    orderFrom: 'BrokerApi',
    errorCode: '',
    stockSymbol: 'کلر',
    easySource: 0,
    creationDateTime: '2020-02-26T08:39:31.748445+03:30' } ]
*/
exports.orderListApi = () => {
  return new Promise((resolve, reject) => {
    const options = {
      url: "https://d11.emofid.com/easy/api/Order",
      method: "GET",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

exports.deleteOrderApi = omsOrderId => {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://d11.emofid.com/easy/api/OmsOrder/${omsOrderId}`,
      method: "DELETE",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        /**
                    {
                        isSuccessfull: false,
                        message: 'خطا از سرویس حذف سفارش (TP)',
                        omsErrorDescription:
                        'System.Exception: for cancel or modify order order state must be in partiallyexcution or onboard or onsending '
                    }
                 */
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

exports.getSymbolDetailsHeader = isin => {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://d11.emofid.com/easy/api/MarketData/GetSymbolDetailsData/${isin}/header`,
      method: "GET",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

exports.getStockInfo = isin => {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://d11.emofid.com/easy/api/MarketData/GetSymbolDetailsData/${isin}/SymbolInfo`,
      method: "GET",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

/**
{
    "lastTradedPrice": 19300,
    "symbolISIN": "IRO1FSAZ0001",
    "closingPrice": 19237,
    "highAllowedprice": 20198,
    "lowAllowedPrice": 18276,
    "priceVar": 0,
    "closingPriceVar": 0,
    "highPrice": 19895,
    "lowPrice": 18600,
    "referencePrice": 19237,
    "totalTradeValue": 0,
    "queues": [
        {
            "bestBuyPrice": 19310,
            "bestSellPrice": 19310,
            "bestSellQuantity": 94506,
            "bestBuyQuantity": 97067,
            "noBestBuy": 46,
            "noBestSell": 12
        },
        ...
    ]
}
*/
exports.getSymbolDetailsMarketDepth = isin => {
  return new Promise((resolve, reject) => {
    const options = {
      url: `https://d11.emofid.com/easy/api/MarketData/GetSymbolDetailsData/${isin}/marketDepth`,
      method: "GET",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

exports.getAuthApi = () => {
  return new Promise((resolve, reject) => {
    const options = {
      url: "https://d11.emofid.com/easy/api/auth/GetAuth",
      method: "GET",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

exports.getStockAllApi = hash => {
  return new Promise((resolve, reject) => {
    const bodyData = {
      hash
    };

    const options = {
      url: "https://d11.emofid.com/easy/api/stock/GetAll",
      method: "POST",
      headers,
      body: JSON.stringify(bodyData)
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

exports.referenceKeyGenerator = () => {
  var e = new Date().getTime();
  return "undefined" != typeof performance &&
    "function" == typeof performance.now &&
    (e += performance.now()), "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
    /[xy]/g,
    function(t) {
      var n = ((e + 16 * Math.random()) % 16) | 0;
      return (e = Math.floor(e / 16)), ("x" === t ? n : (3 & n) | 8).toString(
        16
      );
    }
  );
};

exports.sendOrderApi = (isin, quantity, price, referenceKey, type = "buy") => {
  return new Promise((resolve, reject) => {
    let bodyData = {
      isin,
      quantity,
      price,
      referenceKey
    };

    bodyData.financeId = 1; // TBRFinancialDataProvider: 1
    bodyData.validityType = 74; // Day: 74, Week: 7, Month: 30, ValidToDate: 68, ExecuteAndRemove: 69, ValidToCancellation: 70
    bodyData.validityDateJalali = moment().format("jYYYY/jM/jD");
    bodyData.easySource = 1; // mobile: 0, desktop: 1
    bodyData.side = type === "buy" ? 0 : 1; // buy: 0, sell: 1

    const options = {
      url: "https://d11.emofid.com/easy/api/OmsOrder",
      method: "POST",
      headers,
      body: JSON.stringify(bodyData)
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve({ body: JSON.parse(body), bodyData });
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

exports.getRemainPriceApi = () => {
  return new Promise((resolve, reject) => {
    const options = {
      url: "https://d11.emofid.com/easy/api/Money/GetRemain",
      method: "GET",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};

exports.configurationApi = () => {
  return new Promise((resolve, reject) => {
    const options = {
      url: "https://account.emofid.com/.well-known/openid-configuration",
      method: "GET",
      headers
    };

    request(options, (error, res, body) => {
      if (!error && res.statusCode == 200) {
        resolve(JSON.parse(body));
      } else {
        reject({
          url: options.url,
          error,
          statusCode: res ? res.statusCode : 0
        });
      }
    });
  });
};
