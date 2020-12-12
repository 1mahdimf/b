const request = require("request");
const fs = require("fs");

const {
  delay,
  imgMagickOnlineplus,
  tesseractOcr,
  isString,
} = require("./index");

const orginalCaptcha = `${__dirname}/captcha/exir.jpeg`;
const convertedCaptcha = `${__dirname}/captcha/exir-converted.jpeg`;

class ExirApi {
  constructor(broker) {
    this.sendOrderOptions = null;

    this.credit = null;
    this.isin = null;
    this.orderType = "buy";
    this.price = 0;
    this.quantity = 0;

    this.broker = broker;
    if (broker === "rahbord") {
      this.brokerDomain = "https://rahbord3.irbroker.com";
    } else if (broker === "mehrafarin") {
      this.brokerDomain = "https://mehr.exirbroker.com";
    } else if (broker === "sepehr") {
      this.brokerDomain = "https://sepehr.exirbroker.com";
    } else if (broker === "sahmeashna") {
      this.brokerDomain = "https://abco.exirbroker.com";
    } else if (broker === "parsian") {
      this.brokerDomain = "https://parsian.exirbroker.com";
    } else if (broker === "seavolex") {
      this.brokerDomain = "https://seavolex.exirbroker.com";
    } else if (broker === "atisaz") {
      this.brokerDomain = "https://atisaz.exirbroker.com";
    } else if (broker === "eghtesadebidar") {
      this.brokerDomain = "https://ebb.exirbroker.com";
    } else if (broker === "arzeshafarin") {
      this.brokerDomain = "https://arzeshafarin.exirbroker.com";
    } else if (broker === "karamad") {
      this.brokerDomain = "https://kbc.exirbroker.com";
    } else if (broker === "keshavarzi") {
      this.brokerDomain = "https://agribourse.exirbroker.com";
    } else if (broker === "kian") {
      this.brokerDomain = "https://kian.exirbroker.com";
    } else if (broker === "sarmayehdanesh") {
      this.brokerDomain = "https://ck.exirbroker.com";
    } else if (broker === "khavarmianeh") {
      this.brokerDomain = "https://mec.exirbroker.com";
    } else if (broker === "sabatamin") {
      this.brokerDomain = "https://sabatamin.exirbroker.com";
    }

    this.headers = {
      Origin: this.brokerDomain,
      "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Referer: `${this.brokerDomain}/mainClassic`,
      Connection: "keep-alive",
      cookie:
        "PLAY_LANG=fa; cookiesession1=3386609EBT2JVQBHMMFBIL4HJYJ7908C; PLAY_SESSION=4e3347a6c67d9f126b946e3924dbb488ab1e2e4e-client_login_id=7025d18d6da24f7b9e8e465b57efba0f&client_id=583f19407f1f4c2fb235f0c7db3ced2f&authToken=328d198460db4c2bba9fe909fd55512a",
    };

    this.captchaCookie = "";
  }

  setHeaders(value) {
    this.headers = { ...this.headers, ...value };
  }

  prepareSendOrderOption() {
    let bodyData = {
      insMaxLcode: this.isin,
      quantity: this.quantity,
      price: this.price,
      side: this.orderType === "buy" ? "SIDE_BUY" : "SIDE_SELL",
      id: "",
      version: 1,
      hon: "",
      bankAccountId: -1,
      abbreviation: "",
      latinAbbreviation: "",
      quantityStr: "",
      remainingQuantity: 0,
      priceStr: "",
      tradedQuantity: 0,
      averageTradedPrice: 0,
      disclosedQuantity: 0,
      orderType: "ORDER_TYPE_LIMIT",
      validityType: "VALIDITY_TYPE_DAY",
      validityDate: "",
      validityDateHidden: "hidden",
      orderStatusId: 0,
      queueIndex: -1,
      searchedWord: "",
      coreType: "c",
      marketType: "",
      hasUnderCautionAgreement: false,
      dividedOrder: false,
      clientUUID: "",
    };

    this.sendOrderOptions = {
      url: `${this.brokerDomain}/api/v1/order`,
      method: "POST",
      headers: this.headers,
      body: JSON.stringify(bodyData),
      timeout: 100000, // ms
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
        url: `${this.brokerDomain}/api/v1/user/stockInfo`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body);
          const credit = {
            realBalance: data.financialRemain,
            blockedBalance: data.paymentRequestInProgressRemain,
            accountBalance: data.purchaseUpperBound,
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

  downloadCaptcha(cookie, filename) {
    return new Promise((resolve) => {
      request(
        {
          url: `${this.brokerDomain}/captcha?0.${Math.floor(
            Math.random() * 1000000000 + 1
          )}`,
          headers: {
            authority: this.authority,
            "user-agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
            accept: "image/webp,image/apng,image/*,*/*;q=0.8",
            "sec-fetch-site": "same-origin",
            "sec-fetch-mode": "no-cors",
            "sec-fetch-dest": "image",
            "accept-language": "en-US,en;q=0.9,fa;q=0.8",
            cookie,
          },
        },
        (error, res) => {
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

            this.captchaCookie = list.join(";");
          }
        }
      )
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
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
          "sec-fetch-site": "same-origin",
          "sec-fetch-mode": "cors",
          "sec-fetch-dest": "empty",
          referer: `${this.brokerDomain}/login`,
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

          resolve(list.join(";"));
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

  loginAction(username, password, capcha, cookie) {
    return new Promise((resolve, reject) => {
      const body = {
        brokerCode: 0,
        username,
        password,
        capcha,
      };

      const options = {
        url: `${this.brokerDomain}/api/v1/login`,
        method: "POST",
        body: JSON.stringify(body),
        // followAllRedirects: false, // important
        headers: {
          Connection: "keep-alive",
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/84.0.4147.105 Safari/537.36",
          "Content-Type": "application/json",
          Origin: this.brokerDomain,
          "Sec-Fetch-Site": "same-origin",
          "Sec-Fetch-Mode": "cors",
          "Sec-Fetch-Dest": "empty",
          Referer: `${this.brokerDomain}/login`,
          "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
          Cookie: cookie,
        },
        timeout: 20000, // ms
      };

      request(options, (error, res, body) => {
        try {
          console.log(options, error, res.headers, body);
          if (
            !error &&
            res.headers &&
            res.headers["set-cookie"] &&
            res.headers["set-cookie"].length > 0
          ) {
            if (
              res.statusCode == 200 &&
              body.indexOf("نام کاربری یا کلمه عبور اشتباه است") !== -1
            ) {
              return reject("pass");
            } else if (
              res.statusCode == 200 &&
              body.indexOf("کد امنیتی وارد شده صحیح نیست") !== -1
            ) {
              return reject("captcha");
            }

            return resolve([
              ...res.headers["set-cookie"],
              ...cookie.split(";"),
            ]);
          } else {
            reject(error.toString() ? error.toString() : "خطای نامعلوم");
          }
        } catch (e) {
          reject(e.toString() ? e.toString() : "خطای نامعلوم");
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
              `${cookie};${this.captchaCookie}`
            );
            return resolve(result);
          }
          return reject("پس از تلاش زیاد نتونست کد امنیتی رو بخونه");
        } catch (e) {
          console.log("e", e);
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
        url: `${this.brokerDomain}/api/v3/user/asset`,
        method: "GET",
        headers: this.headers,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const result = JSON.parse(body);
          resolve(
            result.map((r) => ({
              isin: r.insMaxLCode,
              isinName: r.name18fa,
              count: r.asset,
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

module.exports = ExirApi;
