const request = require("request");

class NahayatApi {
  constructor(broker) {
    this.sendOrderOptions = null;

    this.credit = null;
    this.isin = null;
    this.orderType = "buy";
    this.price = 0;
    this.quantity = 0;

    this.domain = "https://www.nahayatnegar.com";
    this.authority = "www.nahayatnegar.com";

    this.headers = {
      Connection: "keep-alive",
      Accept: "application/json, text/plain, */*",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
      "Content-Type": "application/json;charset=UTF-8",
      Origin: this.domain,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      Referer: `${this.domain}/online?v=desktop`,
      "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
    };
  }

  setHeaders(value) {
    this.headers = { ...this.headers, ...value };
  }

  prepareSendOrderOption() {
    var dataString = `{"data":{"split":false,"edit":false,
      "price_percent":[60390,61024,61658,62292,62926,63560,64194,64828,65462,66096,66730],
      "minPrice":60390,"maxPrice":66730,"minLot":1,"maxLot":100000,
      "volume_steps":[10000,20000,30000,40000,50000,60000,70000,80000,90000,100000],
      "csrf":"${csrf}",
      "inst":"${this.isin}",
      "paymentType":"2","limitType":"1","dueType":"1","bondInterest":null,
      "deduct":{"cr":"0.003040000000","xc":"300000000","tx":"0.000000000000","bcr":"0.000256000000","xbcr":"300000000","fcr":"0.000000000000","xfcr":"99999999999","scr":"0.000240000000","xscr":"100000000","ccr":"0.000080000000","xccr":"134000000","tcr":"0.000080000000","xtcr":"80000000","rbcr":"0.000016000000","xrbcr":"26000000"},
      "calcShow":false,"showCalc":false,
      "grandTotal":1,
      "price":"${this.price}",
      "calcValue":0,
      "volume":${this.quantity},
      "draft":false,
      "diffVolume":${this.quantity},
      "orderForm":"${this.orderType}",
      "displayVolume":0}}`;

    this.sendOrderOptions = {
      url: `${this.domain}/online/order/saveOrder`,
      method: "POST",
      headers: this.headers,
      body: dataString,
      timeout: 30000, // ms
    };

    return this.sendOrderOptions;
  }

  sendOrderApi(number) {
    return new Promise((resolve, reject) => {
      request(this.sendOrderOptions, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          resolve({ body: JSON.parse(body), number });
        } else {
          reject({
            err: {
              url: this.sendOrderOptions.url,
              error,
              statusCode: res ? res.statusCode : 0,
            },
            number,
          });
        }
      });
    });
  }

  getRemainPriceApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.domain}/tradingCore/index/getCustomerFinancial`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          try {
            const res = JSON.parse(body);
            if (!res.done) {
              return reject({
                message: `Error done is ${res.done}`,
              });
            }

            const credit = {
              realBalance: res.data.customer.balance,
              blockedBalance: res.data.customer.blockedBroker,
              accountBalance:
                res.data.customer.balance - res.data.customer.blockedBroker,
            };
            this.credit = credit;
            resolve(credit);
          } catch (e) {
            reject({
              url: options.url,
              error,
              statusCode: res ? res.statusCode : 0,
            });
          }
        } else {
          reject({
            url: options.url,
            error,
            statusCode: res ? res.statusCode : 0,
          });
        }
      });
    });
  }
}

module.exports = NahayatApi;
