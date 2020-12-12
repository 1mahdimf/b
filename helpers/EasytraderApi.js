const request = require("request");
const moment = require("jalali-moment");

class Easytrader {
  constructor() {
    this.sendOrderBodyData = null;
    this.headers = {
      Authorization: "Bearer eyJhb...",
      "content-type": "application/json; charset=UTF-8",
      accept: "application/json, text/plain, */*",
      "cache-control": "no-cache",
      referer: "https://d.easytrader.emofid.com/",
      "user-agent": "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36"
    };

    this.credit = null;
    this.isin = null;
    this.orderType = "buy";
    this.price = 0;
    this.quantity = 0;
  }

  setHeaders(value) {
    this.headers = { ...this.headers, ...value };
  }

  prepareSendOrderBodyData() {
    this.sendOrderBodyData = {
      isin: this.isin,
      quantity: this.quantity,
      price: this.price,
      referenceKey: null,
      financeId: 1, // TBRFinancialDataProvider: 1
      validityType: 74, // Day: 74, Week: 7, Month: 30, ValidToDate: 68, ExecuteAndRemove: 69, ValidToCancellation: 70
      validityDateJalali: moment().format("jYYYY/jM/jD"),
      easySource: 1, // mobile: 0, desktop: 1
      side: this.orderType === "buy" ? 0 : 1 // buy: 0, sell: 1
    };

    return this.sendOrderBodyData;
  }

  sendOrderApi(referenceKey) {
    const options = {
      url: "https://d11.emofid.com/easy/api/OmsOrder",
      method: "POST",
      headers: this.headers,
      body: JSON.stringify({ ...this.sendOrderBodyData, referenceKey }),
      timeout: 30000 // ms
    };

    return new Promise((resolve, reject) => {
      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          resolve({ body: JSON.parse(body), refKey: referenceKey });
        } else {
          reject({
            err: {
              url: options.url,
              error,
              statusCode: res ? res.statusCode : 0
            },
            refKey: referenceKey
          });
        }
      });
    });
  }

  getRemainPriceApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: "https://d11.emofid.com/easy/api/Money/GetRemain",
        method: "GET",
        headers: this.headers,
        timeout: 10000 // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body);
          this.credit = data;
          resolve(data);
        } else {
          reject({
            url: options.url,
            error,
            statusCode: res ? res.statusCode : 0
          });
        }
      });
    });
  }
}

module.exports = Easytrader;
