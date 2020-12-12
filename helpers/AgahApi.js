const request = require("request");
const moment = require("jalali-moment");

class AgahApi {
  constructor() {
    this.sendOrderBodyData = null;
    this.nonceOptions = null;

    this.headers = {
      Connection: "keep-alive",
      Accept: "application/json, text/plain, */*",
      "Sec-Fetch-Dest": "empty",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36",
      "Content-Type": "application/json;charset=UTF-8",
      Origin: "https://online.agah.com",
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      Referer: "https://online.agah.com/",
      "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
      cookie:
        "_ga=GA1.2.212751775.1565702367; cookiesession4=V7S1JHQMMxdBtVrl/+TU53Bfq141K81u38YW98l0o6AakYcnmT0sfjcu2SMmiTwSMSQZwYtPxi5aXGovdGuCgYNObhB/bdLInTMzWR2ZqS67RlT90gbCzFGiEilGqZlJtJrKjDJ2xv8//YDsQ77N3/LpUhgZglttsy5XmjWrG8YWtmgIPHwLdpkfH9EVRlgQupZnVrNI1VM=; _gid=GA1.2.37309491.1583261547; SESSION_COOKIE=qvhm4i2js0gxlrqcx40kv0sw; .ASAONLINE=B11ADA80A66909D7B567F253B049D8AB39736DA51C1C0BC50AADE598CC63EABB51B15EC60AD1413E3578967682F606B4DB39F2D3099EB2C9AEC3CE92169B6EDD8EE41573BF4271D7950CC184120BF3D8CF1E44EF10B2A7C2A4009F2340F3A19F68355ACB; Username_COOKIE=gQbMUDy7mZkUwoTsRKWkHcfjlyp5rxOuRBhZM40R7uYaAeDi2u1I+T069gUlDVk0tPfY6wQs04TEl2S9guq44GiQ8NfGHjP9Ie2i7FTHhwGVciNerJv5LPtNNCBc659zoQvC+d0rJXKuDlUq972Zenn96n1Tu24jqBisgI6Y4eV7FUYzzwa3IkJH8inmCIbYXPvzaDlFFxho9zmBDuJHh6uJj2GkJZXlrA+jqwLt/nU/UuDED8Z2YYul1YgwGp8+0Zbs75PffR/XwxMpxu2inm6LgZyEJH7pCB0j1SpZu/GbiPVHmNn/81gg+w0TZPahuJu1Igm5NmPZqNnG8A3nig==",
    };

    this.customerId = null;
    this.customerTitle = null;

    this.instrumentInfo = null;

    this.credit = null;
    this.isin = null;
    this.orderType = "buy";
    this.price = 0;
    this.quantity = 0;

    this.orderSideList = {
      buy: {
        id: 1,
        title: "خرید",
        value: "Buy",
      },
      sell: {
        id: 2,
        title: "فروش",
        value: "Sell",
      },
      twoWay: {
        id: 3,
        title: "دوطرفه",
        value: "Side",
      },
    };
  }

  setHeaders(value) {
    this.headers = { ...this.headers, ...value };
  }

  prepareSendOrderBodyData() {
    this.sendOrderBodyData = {
      orderModel: {
        Id: 0,
        CustomerId: this.customerId,
        CustomerTitle: this.customerTitle,
        OrderSide: this.orderSideList[this.orderType].value,
        OrderSideId: this.orderSideList[this.orderType].id,
        Price: this.price,
        Quantity: this.quantity,
        Value: 0,
        ValidityDate: null,
        MinimumQuantity: null,
        DisclosedQuantity: null,
        ValidityType: 1,
        InstrumentId: this.instrumentInfo.InstrumentId,
        InstrumentName: this.instrumentInfo.Name,
        InstrumentIsin: this.isin,
        BankAccountId: 0,
        ExpectedRemainingQuantity: 0,
        TradedQuantity: 0,
        CategoryId: "13a59ef8-8bb5-423e-5035-f473d7252e51",
        RemainingQuantity: this.quantity,
        OrderExecuterId: 3,
      },
      nonce: null,
    };

    return this.sendOrderBodyData;
  }

  prepareNonceOption() {
    this.nonceOptions = {
      url: "https://online.agah.com/Order/GenerateNonce",
      method: "POST",
      headers: this.headers,
      timeout: 10000, // ms
    };

    return this.nonceOptions;
  }

  generateNonce(categoryId) {
    return new Promise((resolve, reject) => {
      request(this.nonceOptions, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          resolve({ nonce: JSON.parse(body), categoryId });
        } else {
          reject({
            err: {
              url: this.nonceOptions.url,
              error,
              statusCode: res ? res.statusCode : 0,
            },
            categoryId,
          });
        }
      });
    });
  }

  sendOrderApi(nonce, categoryId) {
    return new Promise((resolve, reject) => {
      const options = {
        url: "https://online.agah.com/Order/SendOrder",
        method: "POST",
        headers: this.headers,
        body: JSON.stringify({
          ...this.sendOrderBodyData,
          orderModel: {
            ...this.sendOrderBodyData.orderModel,
            CategoryId: categoryId,
          },
          nonce,
        }),
        timeout: 30000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          resolve({ body: JSON.parse(body), catyId: categoryId });
        } else {
          reject({
            err: {
              url: options.url,
              error,
              statusCode: res ? res.statusCode : 0,
            },
            catyId: categoryId,
          });
        }
      });
    });
  }

  getRemainPriceApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://online.agah.com/Account/GetAccountDetails?customerId=${this.customerId}`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body);
          const credit = {
            realBalance: data.AvailableAmount,
            blockedBalance: data.BankBlockedAmount,
            accountBalance: data.TradableAmount,
          };
          this.credit = credit;
          resolve(credit);
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

  getInstrumentInfo() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://online.agah.com/Watch/GetInstrumentInfo?isin=${this.isin}`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body);
          this.instrumentInfo = data;
          resolve(data);
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

  getOrderListApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://online.agah.com/Order/GetLiveDecision`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body);
          if (data.length === 0) {
            return resolve(data);
          }

          let result = [];
          for (let i = 0; i < data.length; i++) {
            const item = data[i];

            const obj = {
              isin: this.isin, // TODO: hard code
              isinName: item.InstrumentName.trim(),
              createdAt: moment(item.DateTime).format("YYYY-MM-DD HH:mm:ss"),
              date: moment(item.DateTime).format("YYYY-MM-DD"),
              jDate: moment(item.DateTime).format("YYYY-MM-DD HH:mm:ss"),
              price: item.Price,
              orderId: item.OrderId,
              side: item.OrderSideId === 1 ? "buy" : "sell",
              qunatity: item.Quantity,
              statusType: "done", // TODO: hard code
              status: item.RequestType,
              position: item.HostOrderNumber,
            };

            result.push(obj);
          }

          resolve(result);
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

  getOrderDetailsApi() {
    return new Promise((resolve, reject) => {
      this.getOrderListApi().then(
        (orderList) => {
          const foundOrder = orderList.find(
            (order) => order.isinName === this.instrumentInfo.Name.trim()
          );
          resolve(foundOrder);
        },
        (e) => {
          reject(e);
        }
      );
    });
  }

  getPortfolioSymbol() {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await this.getPortfolio();
        const found = list.find((s) => s.InstrumentIsin === this.isin);

        if (!found) return reject("Not found");
        return resolve(found);
      } catch (e) {
        reject(e);
      }
    });
  }

  getPortfolio() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://online.agah.com/Portfolio/GetMyPortfolios?CalculateByTotalNumberOfShare=true&HideZeroAsset=true&IsLastPrice=true&filter=%7B%7D&limit=100&page=1&sort=%7B%22CalculatedTodayCost%22:%22desc%22%7D`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const result = JSON.parse(body).data;
          resolve(
            result.map((r) => ({
              isin: r.InstrumentIsin,
              isinName: r.SecurityTitle,
              price: r.CalculatedAverageBuyPrice,
              count: r.CsdiOnTimeNumberOfShares,
              gainPrice: r.CalculatedGain,
              gainPercent: r.CalculatedGainPercent,
              headLinePrice: r.CalculatedHeadLinePrice,
            }))
          );
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

module.exports = AgahApi;
