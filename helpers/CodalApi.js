const request = require("request");
const moment = require("jalali-moment");

const { delay, twoDigit, fixTime } = require("./index");

class CodalApi {
  static search(name) {
    return new Promise((resolve, reject) => {
      const options = {
        url: encodeURI(`https://codal360.ir/fa/search_symbol/?q=${name}`),
        method: "GET",
        headers: {
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
          Accept: "*/*",
          Referer: "https://codal360.ir/fa/",
          "X-Requested-With": "XMLHttpRequest",
          Connection: "keep-alive",
          Cookie:
            "BIGipServercodal360.ir.app~codal360.ir_pool=1126502572.20480.0000; _ga=GA1.2.1403282132.1588003002; _gid=GA1.2.471890316.1588433132; sessionid=llit0kw92r7dvnr8lu2cuphjkqtwr4dq; TS015170d4=0165c7a205f8e71e2c7e2f2ea10184cb884fa3c4e6bd95a3644bee61d7f6ae16039cf7b37719c6185209ad2154d5f252a755e2b01b5770a31fb94e08fa2008268ee73d546466be487a4bd77492dc5e79cbb6b910fa; _gat_gtag_UA_145921198_1=1",
        },
        gzip: true,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          let findList = [];

          JSON.parse(body).forEach((item) => {
            if (item.symbol === name && item.type === "symbol") {
              findList.push(item);
            }
          });

          if (findList.length === 0) return reject("Not found codal symbol");

          resolve(findList[0]);
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

  static getStatementList(id) {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://codal360.ir/fa/search_statement_result/?symbol_id=${id}&number_row=12&page=1`,
        method: "GET",
        headers: {
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
          Accept: "*/*",
          Referer: "https://codal360.ir/fa/",
          "X-Requested-With": "XMLHttpRequest",
          Connection: "keep-alive",
          Cookie:
            "BIGipServercodal360.ir.app~codal360.ir_pool=1126502572.20480.0000; _ga=GA1.2.1403282132.1588003002; _gid=GA1.2.471890316.1588433132; sessionid=llit0kw92r7dvnr8lu2cuphjkqtwr4dq; TS015170d4=0165c7a205f8e71e2c7e2f2ea10184cb884fa3c4e6bd95a3644bee61d7f6ae16039cf7b37719c6185209ad2154d5f252a755e2b01b5770a31fb94e08fa2008268ee73d546466be487a4bd77492dc5e79cbb6b910fa; _gat_gtag_UA_145921198_1=1",
        },
        gzip: true,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          resolve(JSON.parse(body));
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

  static getStatementListRepeter(id, retryCount = 5) {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getStatementList(id);
          return resolve(result);
        } catch (e) {
          if (i === retryCount) {
            return reject(e);
          }
          await delay(50);
          continue;
        }
      }
    });
  }
}

module.exports = CodalApi;
