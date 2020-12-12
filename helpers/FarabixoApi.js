const request = require("request");
const moment = require("jalali-moment");
const fs = require("fs");

const {
  twoDigit,
  delay,
  imgMagickFarabixo,
  tesseractOcr,
  isString,
} = require("./index");

const orginalCaptcha = `${__dirname}/captcha/farabixo.jpeg`;
const convertedCaptcha = `${__dirname}/captcha/farabixo-converted.jpeg`;

class FarabixoApi {
  constructor(broker) {
    this.sendOrderOptions = null;

    this.credit = null;
    this.isin = null;
    this.orderType = "buy";
    this.price = 0;
    this.quantity = 0;

    this.domain = "https://www.farabixo.com";
    this.authority = "www.farabixo.com";

    this.headers = {
      Connection: "keep-alive",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      Accept: "*/*",
      Origin: this.domain,
      "Sec-Fetch-Site": "same-origin",
      "Sec-Fetch-Mode": "cors",
      "Sec-Fetch-Dest": "empty",
      "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
      // cookie: "UserHasReadedHelp=true; _ga=GA1.2.453850385.1564251849; silverse=405xqj5hbnqhxx3rj5a2zusp; .ASPXAUTH=5B4E3033D0580D46AA2FA7BEB2BF074C6F15EC786F66F2A9A2AE607ED3DE1A8C0F5AB543BD0CDF24D442797A38B871B3B4625AFB64BA3A21D427879C66FCD3BF22D1F6B349AFCF40E04FF675616B97C773A0E64CD2C2212E749349CF6E2DE8B48ECDFD3B065F319CC590F0E14AC7680A08957331E6613534961AA08D8BF36194; Token=d069f86d-9379-4720-958d-4e14df0f112d; GuidedTourVersion=1; _gid=GA1.2.1775704532.1582701452; SiteVersion=3.7.4"
    };
  }

  setHeaders(value) {
    this.headers = { ...this.headers, ...value };
  }

  prepareSendOrderOption() {
    // let bodyData = {
    //   OrderExecutionType: "PopupTrading",
    //   popupSelectionMethod: 1,
    //   Quantity: this.quantity,
    //   Price: this.price,
    //   DisclosedQuantity: "",
    //   AccountRouteType: "1",
    //   ValidityType: "1",
    //   ValidityDate: moment().format("YYYY/MM/DD"),
    //   Sum: "",
    //   id: null,
    //   ParentId: null,
    //   ClientInternalId: "winGuid-902",
    //   InstrumentIdentification: this.isin,
    //   OrderSide: this.orderType === "buy" ? 1 : 2,
    //   InvestorBourseCodeId: "0",
    //   // __RequestVerificationToken: "",
    //   __RequestVerificationToken:
    //     "viGHlwFVdoKE-smH7yV9vNbj1j5wwITvvrblkk320qH5uWuLQ5i2z14dr0Vf7iOzBXSv93mzjrLsmefB1tDcPdM4_QE1",
    // };

    const dataString = `OrderExecutionType=PopupTrading&popupSelectionMethod=1&Quantity=${
      this.quantity
    }&Price=${
      this.price
    }&AccountRouteType=1&ValidityType=1&ValidityDate=${moment().format(
      "YYYY/MM/DD"
    )}&Sum=&id=null&ParentId=null&ClientInternalId=winGuid-902&InstrumentIdentification=${
      this.isin
    }&OrderSide=${
      this.orderType === "buy" ? 1 : 2
    }&InvestorBourseCodeId=0&__RequestVerificationToken=`;

    this.sendOrderOptions = {
      url: `${this.domain}/Tse/Order/AddOnlineOrder`,
      method: "POST",
      headers: this.headers,
      body: dataString, //JSON.stringify(bodyData),
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
        url: `${
          this.domain
        }/Tse/Info/GetCustomerBuyingPower?_dc=${new Date().getTime()}&bourseCodeId=0`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          try {
            const res = JSON.parse(body);
            if (!res.success) {
              return reject({
                message: res.msg,
              });
            }

            const credit = {
              realBalance: res.data.TotalAsset,
              blockedBalance: res.data.CreditBlockedMoney,
              accountBalance: res.data.BuyingPower,
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

  getOrderListApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${this.domain}/Tse/Order/GetOrderInfos?aggregate=false`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body).data;
          if (data.length === 0) {
            return resolve(data);
          }

          let details = [];
          try {
            details = await this.getOrderListDetailsApi();
          } catch (e) {
            details = [];
          }

          let result = [];
          for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const orderId = item[2];

            const [y, m, d] = item[7].split("/");
            const jDate = `${y}-${twoDigit(m)}-${twoDigit(d)}`;

            const date = moment(jDate, "jYYYY-jMM-jDD").format("YYYY-MM-DD");

            let time = "";
            const found = details.find((d) => d.orderId === orderId);
            if (found) {
              time = found.time;
            } else {
              const [hour, min] = item[13].split(":");
              time = `${twoDigit(hour)}:${twoDigit(min)}:00`;
            }

            result.push({
              orderId,
              isin: item[17],
              isinName: item[5],
              createdAt: `${date} ${time}`,
              date,
              jDate,
              price: item[8],
              side: item[9] === "خرید" ? "buy" : "sell",
              qunatity: item[12],
              status: `${item[10]} - ${item[11]}`,
              statusType: item[11] === "Confirmed" ? "done" : "pending",
              position: item[1],
            });
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

  getOrderListDetailsApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${
          this.domain
        }/Tse/Report/GetSearchedOrderInfos?fromDate=${moment().format(
          "YYYY-MM-DD"
        )}T00:00:00&toDate=${moment().format("YYYY-MM-DD")}T00:00:00`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body).data;
          if (data.length === 0) {
            return resolve(data);
          }

          let result = [];
          for (let i = 0; i < data.length; i++) {
            const item = data[i];

            result.push({
              orderId: item[1],
              time: item[12],
            });
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

  getOrderTodayListApi() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${
          this.domain
        }/Tse/Order/GetTradeInfos?_dc=${new Date().getTime()}`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body).data;
          if (data.length === 0) {
            return resolve(data);
          }

          let result = [];
          for (let i = 0; i < data.length; i++) {
            const item = data[i];

            result.push({
              isin: item[4],
              isinName: item[3],
              createdAt: null,
              date: null,
              jDate: null,
              price: item[5],
              orderId: item[0],
              side: item[1] === "خرید" ? "buy" : "sell",
              qunatity: item[6],
              status: "سفارش بصورت کامل انجام شد",
              statusType: "done",
              position: null,
            });
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
      const personageId = "";
      const dataString = `orderId=${orderIds[0]}&personageId=${personageId}&orderExecutionType=&__RequestVerificationToken=`;

      const options = {
        url: `${this.domain}/Tse/Order/CancelOrder`,
        method: "POST",
        headers: this.headers,
        body: dataString,
        timeout: 10000, // ms
      };

      request(options, async (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          const res = JSON.parse(body);
          if (res.isSuccessful) {
            return resolve(res.msg);
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
        url: `${this.domain}/Account/CaptchaImage?mode=b&${Math.floor(
          Math.random() * 10000000 + 1
        )}`,
        headers: {
          authority: this.authority,
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
          accept: "image/webp,image/apng,image/*,*/*;q=0.8",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "no-cors",
          "sec-fetch-dest": "image",
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
        url: `${this.domain}/Account/Login`,
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
          referer: `${this.domain}/Account/Login`,
          "accept-language": "en-US,en;q=0.9,fa;q=0.8",
        },
      };

      request(options, (error, res, body) => {
        if (
          !error &&
          res &&
          res.statusCode == 200 &&
          res.headers &&
          res.headers["set-cookie"] &&
          res.headers["set-cookie"].length > 0
        ) {
          let list = [];
          res.headers["set-cookie"].forEach((cookie) => {
            list.push(cookie.trim().split(";")[0]);
          });

          const tMatch = /<input name="t" type="hidden" value="(.*?)">/i.exec(
            body
          );
          const tField = tMatch[1];

          const tokenMatch = /<input name="__RequestVerificationToken" type="hidden" value="(.*?)"/i.exec(
            body
          );
          const tokenField = tokenMatch[1];

          resolve({ cookie: list.join(";"), tokenField, tField });
        } else {
          reject(
            `ERROR ‍‍${options.url} ${
              res ? `- status code: ${res.statusCode}` : ""
            } ${error ? `- ${error}` : ""} - header length: ${
              res.headers["set-cookie"]
                ? res.headers["set-cookie"].length
                : "NULL"
            }`
          );
        }
      });
    });
  }

  loginAction(username, password, capcha, tokenField, tField, cookie) {
    return new Promise((resolve, reject) => {
      const body = `UserName=${username}&Password=${password}&Captcha=${capcha}&__RequestVerificationToken=${tokenField}&t=${tField}&SelectedCertificate=&StatemAgreementent=on&TokenResponse=&clientScreenWidth=`;

      const options = {
        url: `${this.domain}/Account/Login`,
        method: "POST",
        body,
        followAllRedirects: false, // important
        headers: {
          authority: this.authority,
          "cache-control": "max-age=0",
          "upgrade-insecure-requests": "1",
          origin: this.domain,
          "content-type": "application/x-www-form-urlencoded",
          "user-agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
          accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "navigate",
          "sec-fetch-user": "?1",
          "sec-fetch-dest": "document",
          referer: `${this.domain}/Account/Login`,
          "accept-language": "en-US,en;q=0.9,fa;q=0.8",
          cookie,
        },
        timeout: 20000, // ms
      };

      request(options, (error, res, body) => {
        if (!error) {
          if (
            res.statusCode == 200 &&
            body.indexOf("نام کاربری یا رمز عبور اشتباه است") !== -1
          ) {
            return reject("pass");
          } else if (
            res.statusCode == 200 &&
            body.indexOf("کد امنیتی صحیح نمی باشید") !== -1
          ) {
            return reject("captcha");
          }

          return resolve([...res.headers["set-cookie"], ...cookie.split(";")]);
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
          const {
            cookie,
            tokenField,
            tField,
          } = await this.getCookieBeforeLogin();

          let finalCode = null;
          for (let i = 0; i < retryCaptcha; i++) {
            await this.downloadCaptcha(cookie, orginalCaptcha);

            await imgMagickFarabixo(orginalCaptcha, convertedCaptcha);

            let code = await tesseractOcr(convertedCaptcha);
            code = code.trim();

            if (code.length === 5) {
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
              tokenField,
              tField,
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

  getPortfolioSymbol() {
    return new Promise(async (resolve, reject) => {
      try {
        const list = await this.getPortfolio();
        const found = list.find((s) => s.isin === this.isin);

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
        url: `${
          this.domain
        }/Tse/Portfolio/GetPortfolioInfos?_dc=${new Date().getTime()}&v=2`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const result = JSON.parse(body).data;
          resolve(
            result.map((r) => ({ isin: r[11], isinName: r[3], count: r[5] }))
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

module.exports = FarabixoApi;
