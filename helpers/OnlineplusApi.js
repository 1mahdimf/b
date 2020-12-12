const request = require("request");
const moment = require("jalali-moment");
const fs = require("fs");

const {
  delay,
  imgMagickOnlineplus,
  tesseractOcr,
  isString,
} = require("./index");

const TadbirApi = require("./TadbirApi");

const orginalCaptcha = `${__dirname}/captcha/onlineplus.jpeg`;
const convertedCaptcha = `${__dirname}/captcha/onlineplus-converted.jpeg`;

class OnlineplusApi {
  constructor(broker) {
    this.sendOrderOptions = null;

    this.credit = null;
    this.isin = null;
    this.orderType = "buy";
    this.price = 0;
    this.quantity = 0;

    this.broker = broker;
    if (broker === "mofid") {
      this.brokerDomain = "https://api2.mofidonline.com";
      this.authority = "onlineplus.mofidonline.com";
    } else if (broker === "mobin") {
      this.brokerDomain = "https://api2.mobinsb.com";
      this.authority = "silver.mobinsb.com";
    } else if (broker === "moshaveransaham") {
      this.brokerDomain = "https://silver.onlinesahm.com";
      this.authority = "silver.onlinesahm.com";
    } else if (broker === "sabajahad") {
      this.brokerDomain = "https://silver.sjb.co.ir";
      this.authority = "silver.sjb.co.ir";
    } else if (broker === "maskan") {
      this.brokerDomain = "https://silver.maskanbourse.com";
      this.authority = "silver.maskanbourse.com";
    } else if (broker === "meli") {
      this.brokerDomain = "https://onlineplus.bmibourse.com";
      this.authority = "onlineplus.bmibourse.com";
    } else if (broker === "dana") {
      this.brokerDomain = "https://silver.danabrokers.com";
      this.authority = "silver.danabrokers.com";
    } else if (broker === "danayanpars") {
      this.brokerDomain = "https://silver.dp-broker.com";
      this.authority = "silver.dp-broker.com";
    } else if (broker === "saman") {
      this.brokerDomain = "https://silver.samanbourse.com";
      this.authority = "silver.samanbourse.com";
    } else if (broker === "isatis") {
      this.brokerDomain = "https://silver.ipb.ir";
      this.authority = "silver.ipb.ir";
    } else if (broker === "ordibehesht") {
      this.brokerDomain = "https://silver.oibourse.com";
      this.authority = "silver.oibourse.com";
    } else if (broker === "dey") {
      this.brokerDomain = "https://onlineplus.daybroker.ir";
      this.authority = "onlineplus.daybroker.ir";
    }

    this.headers = {
      "user-agent":
        "Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.122 Safari/537.36",
      origin: `https://${this.authority}`,
      referer: `https://${this.authority}/Home/Default/page-1`,
      authority: this.authority,
      "sec-fetch-dest": "empty",
      "x-requested-with": "XMLHttpRequest",
      "content-type": "application/json",
      accept: "*/*",
      "sec-fetch-site": "same-origin",
      "sec-fetch-mode": "cors",
      "accept-language": "en-US,en;q=0.9,fa;q=0.8",
      // cookie: "UserHasReadedHelp=true; _ga=GA1.2.453850385.1564251849; silverse=405xqj5hbnqhxx3rj5a2zusp; .ASPXAUTH=5B4E3033D0580D46AA2FA7BEB2BF074C6F15EC786F66F2A9A2AE607ED3DE1A8C0F5AB543BD0CDF24D442797A38B871B3B4625AFB64BA3A21D427879C66FCD3BF22D1F6B349AFCF40E04FF675616B97C773A0E64CD2C2212E749349CF6E2DE8B48ECDFD3B065F319CC590F0E14AC7680A08957331E6613534961AA08D8BF36194; Token=d069f86d-9379-4720-958d-4e14df0f112d; GuidedTourVersion=1; _gid=GA1.2.1775704532.1582701452; SiteVersion=3.7.4"
    };
  }

  setHeaders(value) {
    console.log(value);
    this.headers = { ...this.headers, ...value };
  }

  prepareSendOrderOption() {
    let bodyData = {
      IsSymbolCautionAgreement: false,
      CautionAgreementSelected: false,
      IsSymbolSepahAgreement: false,
      SepahAgreementSelected: false,
      orderCount: this.quantity,
      orderPrice: this.price,
      FinancialProviderId: 1, // TBRFinancialDataProvider: 1
      minimumQuantity: 0,
      maxShow: 0,
      orderId: 0,
      isin: this.isin,
      orderSide: this.orderType === "buy" ? 65 : "86", // buy: 65, sell: 86
      orderValidity: 74, // Day: 74, Week: 7, Month: 30, ValidToDate: 68, ExecuteAndRemove: 69, ValidToCancellation: 70
      orderValiditydate: null,
      shortSellIsEnabled: false,
      shortSellIncentivePercent: 0,
    };

    this.sendOrderOptions = {
      url: `${this.brokerDomain}/Web/V1/Order/Post`,
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(bodyData),
      timeout: 30000, // ms
    };

    return this.sendOrderOptions;
  }

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
        url: `${this.brokerDomain}/Web/V1/Accounting/Remain`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body).Data;
          if (!data.BourseCode) {
            return reject({
              url: options.url,
              error: "Access deny",
              statusCode: 403,
            });
          }

          const credit = {
            realBalance: data.RealBalance,
            blockedBalance: data.BlockedBalance,
            accountBalance: data.AccountBalance,
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

  getOrderListApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.brokerDomain}/Web/V1/Order/GetOpenOrder/OpenOrder`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body).Data;
          if (data.length === 0) {
            return resolve(data);
          }

          let result = [];
          for (let i = 0; i < data.length; i++) {
            const item = data[i];

            const date = moment(item.dtime, "jYYYY/jMM/jDD").format(
              "YYYY-MM-DD"
            );
            const obj = {
              isin: item.nsccode,
              isinName: item.symbol,
              createdAt: `${date} ${item.time}`,
              date,
              jDate: item.dtime.replace(/\//g, "-"),
              price: item.orderprice,
              orderId: item.orderid,
              side: item.ordersideid === 65 ? "buy" : "sell",
              qunatity: item.qunatity,
              status: item.status,
              statusType:
                item.status.trim().indexOf("ثبت در سیستم معاملات") !== -1 ||
                item.status.trim().indexOf("قسمتی از سفارش") !== -1
                  ? "done"
                  : "pending",
              position: item.HostOrderId,
              volumetricPosition: 0,
            };

            // try {
            //   obj.volumetricPosition = await this.getVolumetricPositionApi(
            //     obj.isin,
            //     obj.position,
            //     obj.price,
            //     date,
            //     obj.side
            //   );
            // } catch (e) {
            //   obj.volumetricPosition = 0;
            // }

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

  getVolumetricPositionApi(isin, position, price, date, side = "buy") {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://core.tadbirrlc.com/AlmasDataHandler.ashx?{%22Type%22:%22GetOrderValue%22,%22la%22:%22Fa%22,%22ISIN%22:%22${isin}%22,%22OrderSequenceNumber%22:${position},%22OrderPrice%22:${price},%22OrderSide%22:${
          side === "buy" ? 65 : 86
        },%22orderentrydate%22:%22${date.replace(/-/g, "")}%22}&jsoncallback=`,
        method: "GET",
        headers: {
          "user-agent": this.headers["user-agent"],
          referer: this.headers["referer"],
          origin: this.headers["origin"],
        },
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const result = JSON.parse(body).Value;
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

  getOrderDetailsApi(retryCount = 3) {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= retryCount; i++) {
        try {
          const orderList = await this.getOrderListApi();

          let foundOrders = [];
          orderList.forEach((order) => {
            if (order.isin === this.isin) {
              foundOrders.push(order);
            }
          });
          return resolve(foundOrders);
        } catch (e) {
          if (i === retryCount) {
            return reject("Not found");
          }
          await delay(5000);
          continue;
        }
      }
    });
  }

  // getPortfolioSymbol() {
  //   return new Promise((resolve, reject) => {
  //     const options = {
  //       url: `${this.brokerDomain}/Customer/GetDailyCustomerStockPortfolio?symbolIsin=${this.isin}`,
  //       method: "GET",
  //       headers: this.headers,
  //       timeout: 10000, // ms
  //     };

  //     request(options, (error, res, body) => {
  //       if (!error && res.statusCode == 200) {
  //         const result = JSON.parse(body).Data;
  //         resolve({ ...result[0], count: result[0].CSDPortfolioCount });
  //       } else {
  //         reject({
  //           url: options.url,
  //           error,
  //           statusCode: res ? res.statusCode : 0,
  //         });
  //       }
  //     });
  //   });
  // }

  getPortfolioSymbol() {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await this.getPortfolio();
        const found = list.find((s) => s.ISIN === this.isin);

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
        url: `${this.brokerDomain}/Web/V1/DailyPortfolio/Get/DailyPortfolio`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const result = JSON.parse(body).Data;
          resolve(result.map((r) => ({ ...r, count: r.CSDPortfolioCount })));
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

  getPortfolioRealTime() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.brokerDomain}/RealtimePortfolio/GetNewCustomerPortfolioRecords?GetJustHasRemain=true&EndDate=undefined&BasedOnLastPositivePeriod=true&ActiveSymbolsStartDate=&ActiveSymbolsEndDate=`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const result = JSON.parse(body).Data;

          const isinList = result.map((item) => item.SymbolISIN);
          const detailsInfo = await TadbirApi.getSybmolDetailsListByIsinList(
            isinList
          );

          const sumTotalPrice =
            result.reduce((sum, i) => sum + i.TotalBuyPrice, 0) || 1;

          resolve(
            result.map((r) => {
              const info = detailsInfo.find((d) => d.isin === r.SymbolISIN);

              const buyTotalPrice =
                parseInt(r.RemainQuantity, 10) * parseInt(r.AveragePrice, 10);
              const buyCal =
                buyTotalPrice +
                (Math.floor(buyTotalPrice * 0.0038) +
                  Math.floor(buyTotalPrice * 0.00032) +
                  Math.floor(buyTotalPrice * 0.00012) +
                  Math.floor(buyTotalPrice * 0.0001) +
                  Math.floor(buyTotalPrice * 0.0003));

              const closeTotalPrice =
                parseInt(r.RemainQuantity, 10) * info.closingPrice;
              const finalPriceCal =
                closeTotalPrice -
                (Math.floor(closeTotalPrice * 0.0038) +
                  Math.floor(closeTotalPrice * 0.00032) +
                  Math.floor(closeTotalPrice * 0.00018) +
                  Math.floor(closeTotalPrice * 0.00015) +
                  Math.floor(closeTotalPrice * 0.0003) +
                  Math.floor(closeTotalPrice * 0.005));

              const lastTotalPrice =
                parseInt(r.RemainQuantity, 10) * info.lastTradedPrice;
              const lastTradePriceCal =
                lastTotalPrice -
                (Math.floor(lastTotalPrice * 0.0038) +
                  Math.floor(lastTotalPrice * 0.00032) +
                  Math.floor(lastTotalPrice * 0.00018) +
                  Math.floor(lastTotalPrice * 0.00015) +
                  Math.floor(lastTotalPrice * 0.0003) +
                  Math.floor(lastTotalPrice * 0.005));

              const finalPricePercent = (finalPriceCal / buyCal) * 100 - 100;
              const lastTradePricePercent =
                (lastTradePriceCal / buyCal) * 100 - 100;

              return {
                ...r,
                quantity: r.RemainQuantity,
                isin: r.SymbolISIN,
                isinName: r.SymbolFa,
                price: r.AveragePrice,
                totalPrice: r.TotalBuyPrice,
                percent:
                  Math.round((r.TotalBuyPrice / sumTotalPrice) * 100) || 1,
                finalPricePercent: finalPricePercent.toFixed(2),
                lastTradePricePercent: lastTradePricePercent.toFixed(2),
                finalPrice: finalPriceCal - buyCal,
                lastTradePrice: lastTradePriceCal - buyCal,
              };
            })
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

  getOrderTodayListApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.brokerDomain}/Web/V1/Order/GetTodayOrders/Customer/GetCustomerTodayOrders`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body).Data;
          if (data.length === 0) {
            return resolve(data);
          }

          let result = [];
          for (let i = 0; i < data.length; i++) {
            const item = data[i];

            const date = moment(item.dtime, "jYYYY/jMM/jDD").format(
              "YYYY-MM-DD"
            );
            const obj = {
              isin: item.nsccode,
              isinName: item.symbol,
              createdAt: `${date} ${item.time}`,
              date,
              jDate: item.dtime.replace(/\//g, "-"),
              price: item.orderprice,
              orderId: item.orderid,
              side: item.ordersideid === 65 ? "buy" : "sell",
              qunatity: item.excuted,
              status: item.status,
              statusType:
                item.status.trim() === "سفارش بصورت کامل انجام شد" ||
                item.status.trim().indexOf("قسمتی از سفارش") !== -1
                  ? "done"
                  : "failed",
              position: item.HostOrderId,
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

  getOrderTodayDetailsApi() {
    return new Promise((resolve, reject) => {
      this.getOrderTodayListApi().then(
        (orderList) => {
          const foundOrder = orderList.find(
            (order) => order.isin === this.isin
          );
          resolve(foundOrder);
        },
        (e) => {
          reject(e);
        }
      );
    });
  }

  cancelOrders(orderIds) {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.brokerDomain}/Customer/CancelOrders`,
        method: "POST",
        headers: this.headers,
        body: JSON.stringify(orderIds),
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          const res = JSON.parse(body);
          if (res.IsSuccessfull) {
            return resolve(res.Data);
          }
          return reject({ error: "خطایی رخ داده است" });
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

  downloadCaptcha(cookie, filename) {
    return new Promise((resolve) => {
      request({
        url: `${this.brokerDomain}/${Math.floor(
          Math.random() * 10000000 + 1
        )}/Account/Captcha?postfix=${Math.floor(Math.random() * 10000000 + 1)}`,
        headers: {
          authority: this.authority,
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
          accept: "image/webp,image/apng,image/*,*/*;q=0.8",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "no-cors",
          "sec-fetch-dest": "image",
          referer: `${this.brokerDomain}/login`,
          "accept-language": "en-US,en;q=0.9,fa;q=0.8",
          cookie,
        },
      })
        .pipe(fs.createWriteStream(filename))
        .on("close", resolve);
    });
  }

  getCookieBeforeLogin() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.brokerDomain}/login`,
        method: "GET",
        timeout: 3000, // ms
        headers: {
          authority: this.authority,
          accept: "application/json, text/plain, */*",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `${this.brokerDomain}/login`,
          "accept-language": "en-US,en;q=0.9,fa;q=0.8",
        },
      };

      request(options, (error, res) => {
        if (
          !error &&
          res &&
          res.statusCode == 200 &&
          res.headers &&
          res.headers["set-cookie"] &&
          res.headers["set-cookie"].length > 0
        ) {
          const cookies = res.headers["set-cookie"][0].trim().split(";");
          resolve(cookies[0]);
        } else {
          reject(
            `ERROR ‍‍${options.url} ${
              res ? `- status code: ${res.statusCode}` : ""
            } ${error ? `- ${error}` : ""}`
          );
        }
      });
    });
  }

  loginAction(username, password, capcha, cookie) {
    return new Promise((resolve, reject) => {
      const body = `username=${username}&password=${password}&capcha=${capcha}`;

      const options = {
        url: `${this.brokerDomain}/login`,
        method: "POST",
        body,
        followAllRedirects: false, // important
        headers: {
          authority: this.authority,
          "cache-control": "max-age=0",
          "upgrade-insecure-requests": "1",
          origin: this.brokerDomain,
          "content-type": "application/x-www-form-urlencoded",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "navigate",
          "sec-fetch-user": "?1",
          "sec-fetch-dest": "document",
          referer: `${this.brokerDomain}/login`,
          "accept-language": "en-US,en;q=0.9,fa;q=0.8",
          cookie,
        },
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error) {
          if (res.statusCode == 302) {
            return resolve(res.headers["set-cookie"]);
          } else if (
            res.statusCode == 200 &&
            body.indexOf("نام کاربری یا کلمه عبور اشتباه است") !== -1
          ) {
            return reject("pass");
          } else if (
            res.statusCode == 200 &&
            body.indexOf("کد امنیتی وارد شده اشتباه می باشد") !== -1
          ) {
            return reject("captcha");
          }
          reject(`خطای نامعلوم - ${res ? res.statusCode : 0}`);
        } else {
          reject(error.toString() ? error.toString() : "خطای نامعلوم");
        }
      });
    });
  }

  login(username, password, retryCaptcha = 10, retryLogin = 5) {
    return new Promise(async (resolve, reject) => {
      for (let j = 0; j < retryLogin; j++) {
        try {
          const cookie = await this.getCookieBeforeLogin();

          let finalCode = null;
          for (let i = 0; i < retryCaptcha; i++) {
            await this.downloadCaptcha(cookie, orginalCaptcha);

            await imgMagickOnlineplus(orginalCaptcha, convertedCaptcha);

            let code = await tesseractOcr(convertedCaptcha);
            code = code.trim();

            if (code.length === 4) {
              finalCode = code;
              break;
            }

            await delay(300);
          }

          if (finalCode) {
            const result = await this.loginAction(
              username,
              password,
              finalCode,
              cookie
            );
            return resolve(result);
          }
          return reject("پس از تلاش زیاد نتونست کد امنیتی رو بخونه");
        } catch (e) {
          if (isString(e)) {
            if (e === "captcha") {
              await delay(3000);
              continue;
            } else if (e === "pass") {
              return reject("نام کاربری یا کلمه عبور اشتباه است");
            }
          }
          return reject(e);
        }
      }
      reject("خطای نامعلوم");
    });
  }
}

module.exports = OnlineplusApi;
