const request = require("request");
const moment = require("jalali-moment");

const {
  delay,
  twoDigit,
  fixTime,
  advRound,
  isString,
  removeDuplicates,
} = require("./index");

class TsetmcApi {
  constructor() {
    this.headers = {
      "Accept-Encoding": "gzip, deflate",
      "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
      Accept: "text/plain, */*; q=0.01",
      Referer:
        "http://www.tsetmc.com/Loader.aspx?ParTree=151311&i=39610074039667804",
      "X-Requested-With": "XMLHttpRequest",
      Connection: "keep-alive",
      // Cookie: "_ga=GA1.2.1796840546.1565599470; _gid=GA1.2.1613071832.1585273603; ASP.NET_SessionId=hci2uso0xsb2ncr2xkv13ks4"
    };
  }

  static getSymbolInfoMain(id) {
    return new Promise((resolve, reject) => {
      const options = {
        url: `http://www.tsetmc.com/tsev2/data/instinfofast.aspx?i=${id}&c=44+`,
        method: "GET",
        headers: {
          "Accept-Encoding": "gzip, deflate",
          "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
          Accept: "text/plain, */*; q=0.01",
          Referer:
            "http://www.tsetmc.com/Loader.aspx?ParTree=151311&i=39610074039667804",
          "X-Requested-With": "XMLHttpRequest",
          Connection: "keep-alive",
        },
        gzip: true,
        timeout: 300, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          const virgol = body.split(";");
          const virSplit = virgol[0].split(",");

          const status = virSplit && virSplit[1] ? virSplit[1].trim() : "";
          const lastTradePrice =
            virSplit && virSplit[2] ? virSplit[2].trim() : 0;
          const finalPrice =
            virSplit && virSplit[3] ? parseInt(virSplit[3].trim(), 10) : 0;
          const noTrade =
            virSplit && virSplit[8] ? parseInt(virSplit[8].trim(), 10) : 0;
          const volumeTrade =
            virSplit && virSplit[9] ? parseInt(virSplit[9].trim(), 10) : 0;

          let table = null;
          if (virgol && virgol[2]) {
            table = virgol[2].split(",").map((item) => {
              if (!item) return undefined;

              const row = item.split("@");
              return {
                buy: {
                  userCount: row[0],
                  volume: row[1],
                  price: row[2],
                },
                sell: {
                  userCount: row[5],
                  volume: row[4],
                  price: row[3],
                },
              };
            });
          }

          let tradeDetails = {
            noBuyReal: 0,
            noBuyLegal: 0,
            noSellReal: 0,
            noSellLegal: 0,
            volumeBuyReal: 0,
            volumeBuyLegal: 0,
            volumeSellReal: 0,
            volumeSellLegal: 0,
            noTrade: 0,
            volumeTrade: 0,
          };
          if (virgol && virgol[4]) {
            const it = virgol[4].split(",");

            tradeDetails = {
              volumeBuyReal: parseInt(it[0], 10),
              volumeBuyLegal: parseInt(it[1], 10),
              volumeSellReal: parseInt(it[3], 10),
              volumeSellLegal: parseInt(it[4], 10),
              noBuyReal: parseInt(it[5], 10),
              noBuyLegal: parseInt(it[6], 10),
              noSellReal: parseInt(it[8], 10),
              noSellLegal: parseInt(it[9], 10),
              noTrade,
              volumeTrade,
            };
          }

          resolve({
            status,
            lastTradePrice,
            finalPrice,
            noTrade,
            volumeTrade,
            table,
            tradeDetails,
          });
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

  static getDetailsSymbolRepeter(id, retryCount = 5) {
    return new Promise(async (resolve) => {
      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getSymbolInfoMain(id);
          return resolve(result);
        } catch (e) {
          console.log("retry symbol", i, e);
          if (i === retryCount) {
            return resolve(null);
          }
          await delay(2000);
          continue;
        }
      }
    });
  }

  static getSymbolInfo(code, retriesLeft = 50, interval = 20) {
    return new Promise((resolve, reject) => {
      this.retry(this.getSymbolInfoMain, code, retriesLeft, interval).then(
        resolve,
        reject
      );
    });
  }

  static retry(fn, code, retriesLeft = 5, interval = 1000) {
    return new Promise((resolve, reject) => {
      fn(code)
        .then(resolve)
        .catch((error) => {
          setTimeout(() => {
            if (retriesLeft === 1) {
              // reject('maximum retries exceeded');
              reject(error);
              return;
            }

            // Passing on "reject" is the important part
            this.retry(fn, code, interval, retriesLeft - 1).then(
              resolve,
              reject
            );
          }, interval);
        });
    });
  }

  static getSymbolList() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `http://www.tsetmc.com/tsev2/data/MarketWatchInit.aspx?h=0&r=0`,
        method: "GET",
        headers: this.headers,
        gzip: true,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const atSign = body.split("@");
          const virgol = atSign[2].split(";");

          const list = virgol.map((item) => {
            if (!item) return undefined;

            const row = item.split(",");
            return {
              insCode: row[0],
              isin: row[1],
              name: row[2].replace(/ي/g, "ی"),
              description: row[3],
              closingPrice: parseInt(row[6], 10),
            };
          });

          resolve(list);
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

  static search(query, limit = 5) {
    return new Promise((resolve, reject) => {
      this.getSymbolList().then((list) => {
        let findList = [];

        const regexp = RegExp(`^${query}`);
        list.forEach((item) => {
          if (regexp.test(item.name) || regexp.test(item.isin)) {
            findList.push(item);
          }
        });

        if (findList.length === 0) return reject("Not found");

        resolve(findList.slice(0, limit));
      }, reject);
    });
  }

  static getNazerMessageList(id = null, getToday = false, mergeSymbol = false) {
    return new Promise((resolve, reject) => {
      const options = {
        url: id
          ? `http://www.tsetmc.com/Loader.aspx?Partree=15131W&i=${id}`
          : "http://www.tsetmc.com/Loader.aspx?ParTree=151313&Flow=0",
        method: "GET",
        headers: this.headers,
        gzip: true,
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          let list = [];

          const regex = /<tr><th>(.*?)<\/th>\s+<th class='ltr'>(.*?)<\/th>\s+<\/td><\/tr>\s+<tr><td colspan="2">(.*?)<hr \/>/gm;
          const symbolRegex = /\((.*?)\)/gm;

          let match;
          while ((match = regex.exec(body)) !== null) {
            const title = match[1].replace(/ي/g, "ی").replace(/ك/g, "ک");
            const text = match[3].replace(/ي/g, "ی").replace(/ك/g, "ک");

            if (
              title.indexOf("اختیار خرید") !== -1 ||
              title.indexOf("اختیار فروش") !== -1
            )
              continue;

            let symbols = [];
            let matchSymbol = null;
            while ((matchSymbol = symbolRegex.exec(text)) !== null) {
              const symbol = matchSymbol[1].trim();

              if (symbol.length === 1) continue;
              if (symbol.indexOf(".") !== -1) continue;
              if (symbol.indexOf(" ") !== -1) continue;

              symbols.push(symbol.replace(/1$/, ""));
            }
            if (symbols.length > 0) symbols = removeDuplicates(symbols);

            let types = [];
            if (title.indexOf("توقف نماد") !== -1) {
              types.push("توقف");
            }
            if (title.indexOf("وقفه معاملاتی") !== -1) {
              types.push("وقفه_معاملاتی");
            }
            if (title.indexOf("گشایش") !== -1) {
              types.push("گشایش");
            }
            if (title.indexOf("بازگشایی نماد") !== -1) {
              types.push("بازگشایی");
            }
            if (title.indexOf("50 درصد") !== -1) {
              types.push("تغییرات_50_درصدی");
            }
            if (title.indexOf("20 درصد") !== -1) {
              types.push("تغییرات_20_درصدی");
            }
            if (title.indexOf("افشای اطلاعات") !== -1) {
              types.push("افشای_اطلاعات");
            }
            if (
              title.indexOf("گروه الف") !== -1 ||
              text.indexOf("گروه الف") !== -1
            ) {
              types.push("گروه_الف");
            }
            if (
              title.indexOf("گروه ب") !== -1 ||
              text.indexOf("گروه ب") !== -1
            ) {
              types.push("گروه_ب");
            }

            if (text.indexOf("مجمع عمومی") !== -1) {
              types.push("مجمع_عمومی");
            }
            if (text.indexOf("پیش گشایش") !== -1) {
              types.push("پیش_گشایش");
            }
            if (
              text.indexOf("بدون محدودیت نوسان") !== -1 ||
              text.indexOf("بدون محدودیت دامنه نوسان") !== -1
            ) {
              types.push("بدون_محدودیت_نوسان");
            }
            if (
              text.indexOf("با محدودیت نوسان") !== -1 ||
              text.indexOf("با محدودیت دامنه نوسان") !== -1
            ) {
              types.push("با_محدودیت_نوسان");
            }

            const dateTime = match[2].match(
              /([0-9]{2,4})\/([0-9]{1,2})\/([0-9]{1,2}) ([0-9]{1,2}):([0-9]{1,2})/
            );

            const jDate = `13${dateTime[1]}-${twoDigit(dateTime[2])}-${twoDigit(
              dateTime[3]
            )}`;
            const time = `${twoDigit(dateTime[4])}:${twoDigit(dateTime[5])}:00`;

            const toGeorgian = moment(
              `${jDate} ${time}`,
              "jYYYY/jMM/jDD HH:mm:ss"
            );

            const isToday = toGeorgian.isSameOrAfter(
              moment().format("YYYY-MM-DD 00:00:00")
            );

            if (getToday && !isToday) continue;

            const date = toGeorgian.format("YYYY-MM-DD");

            list.push({
              title,
              jDate,
              date,
              time,
              dateTime: `${date} ${time}`,
              orginalDateTime: match[2],
              text,
              isToday,
              symbols,
              types,
            });
          }

          let mergeList = {};
          if (mergeSymbol) {
            list.forEach((item) => {
              if (item.symbols.length === 0) {
                if (!mergeList["other"]) mergeList["other"] = [];
                mergeList["other"].push(item);
                return;
              }

              item.symbols.forEach((symbolItem) => {
                if (!mergeList[symbolItem]) mergeList[symbolItem] = [];
                mergeList[symbolItem].push(item);
              });
            });
          }

          resolve(mergeSymbol ? mergeList : list);
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

  static getNazerMessageListRepeter(
    id = null,
    getToday = false,
    mergeSymbol = false,
    retryCount = 5
  ) {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getNazerMessageList(
            id,
            getToday,
            mergeSymbol
          );
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

  static getDetailsByDateRequest(options, limitQueue = null) {
    return new Promise((resolve, reject) => {
      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          console.log("get data by date");

          const intraTradeData = body.match(
            /var IntraTradeData=\[\[(.*?)\]\];/m
          );

          let intraSplit = null;
          if (intraTradeData) {
            intraSplit = intraTradeData[1].split("],[");
            if (!intraSplit) {
              console.log("error in intraSplit");
              return resolve(false);
            }
          }

          let intraTrade = [];
          if (intraSplit) {
            intraSplit.forEach((intra) => {
              const int = intra.split(",");
              intraTrade.push({
                time: int[1].replace(/'/g, ""),
                volume: parseInt(int[2].replace(/'/g, ""), 10),
                price: parseInt(int[3].replace(/'/g, ""), 10),
              });
            });
            intraTrade = intraTrade.sort(
              (a, b) =>
                parseInt(a.time.replace(/:/g, ""), 10) -
                parseInt(b.time.replace(/:/g, ""), 10)
            );
          }

          const instSimpleData = body.match(
            /var InstSimpleData=\[.*?,([0-9]+)\];/m
          );
          if (!instSimpleData) {
            return reject("dont get instSimpleData");
          }

          if (parseInt(instSimpleData[1], 10) <= 1) {
            console.log("error in instSimpleData");
            return resolve(false);
          }

          const closingPriceData = body.match(
            /var ClosingPriceData=.*?\['(.*?)','.*?','([0-9]+)','([0-9]+)','[0-9]+','([0-9]+)','([0-9]+)','([0-9]+)','([0-9]+)','([0-9]+)','[0-9]+','[0-9]+','[0-9]+'\]\];/m
          );
          if (
            !closingPriceData ||
            (closingPriceData && parseInt(closingPriceData[7], 10) === 0)
          ) {
            console.log("error in closingPriceData");
            return resolve(false);
          }

          if (parseInt(closingPriceData[8], 10) === 0) {
            console.log("zero volume trade");
            return resolve(false);
          }

          const staticTreshholdData = body.match(
            /var StaticTreshholdData=\[\[(.*?)\]\];/m
          );
          if (!staticTreshholdData) {
            return reject("dont get staticTreshholdData");
          }
          const highLow = staticTreshholdData[1].split("],[")[1].split(",");

          const baseDetails = {
            lastTradeDateTime: closingPriceData[1],
            lastTradePrice: parseInt(closingPriceData[2], 10),
            finalPrice: parseInt(closingPriceData[3], 10),
            yesterdayFinalPrice: parseInt(closingPriceData[4], 10),
            maxTradePrice: parseInt(closingPriceData[5], 10),
            minTradePrice: parseInt(closingPriceData[6], 10),
            highPrice: parseInt(highLow[1], 10),
            lowPrice: parseInt(highLow[2], 10),
            basisVolume: parseInt(instSimpleData[1], 10),
          };

          let queueList = [];
          let countQueue = 0;
          const bestLimitData = body.match(/var BestLimitData=\[(.*?)\];/m);
          if (bestLimitData && bestLimitData[1]) {
            const timeList = [
              "08:30:10",
              "08:45:00",
              "08:58:00",
              "09:30:00",
              "10:00:00",
              "10:30:00",
              "11:00:00",
              "11:30:00",
              "12:00:00",
              "12:15:00",
              "12:31:01",
            ];
            let findTime = [];
            let volumeTrade = 0;
            let countTrade = 0;
            bestLimitData[1].split("],").forEach((it) => {
              if (limitQueue && countQueue >= limitQueue) return;

              const d = it.split(",");
              if (d.length === 0) return;
              if (!d[1]) return;
              const pos = parseInt(d[1].replace(/'/g, ""));
              if (pos !== 1) return;

              const time = d[0].replace("[", "");
              const first = parseInt(time.charAt(0), 10);
              if (first > 2 && first < 8) return;

              volumeTrade = 0;
              countTrade = 0;

              const timeFixed = fixTime(time);

              let row = 0;
              if (queueList.length === 0) {
                row = 1;
              } else {
                const timeMoment = moment(timeFixed, "HH:mm:ss");

                for (let z = 0; z < timeList.length - 1; z++) {
                  if (findTime.indexOf(z) !== -1) continue;

                  const calTime = timeList[z];
                  const calTimeAfter = timeList[z + 1];

                  if (
                    timeMoment.isBetween(
                      moment(calTime, "HH:mm:ss"),
                      moment(calTimeAfter, "HH:mm:ss").subtract(1, "s")
                    )
                  ) {
                    row = z + 2;
                    findTime.push(z);

                    if (z > 2 && intraTrade.length > 0) {
                      for (let itt = 0; itt < intraTrade.length; itt++) {
                        const intr = intraTrade[itt];
                        volumeTrade += intr.volume;
                        countTrade++;

                        if (
                          moment(intr.time, "HH:mm:ss").isSameOrAfter(
                            timeMoment
                          )
                        )
                          break;
                      }
                    }

                    break;
                  }
                }
              }

              queueList.push({
                row,
                time: timeFixed,
                noBuy: parseInt(d[2].replace(/'/g, "")),
                volumeBuy: parseInt(d[3].replace(/'/g, "")),
                priceBuy: parseInt(d[4].replace(/'/g, "")),
                priceSell: parseInt(d[5].replace(/'/g, "")),
                volumeSell: parseInt(d[6].replace(/'/g, "")),
                noSell: parseInt(d[7].replace(/'/g, "")),
                volumeTrade,
                countTrade,
              });

              countQueue++;
            });

            if (queueList.length <= 1) {
              console.log("error in queueList length is 0");
              return resolve(false);
            }
          }

          let instrumentList = [];
          const instrumentStateData = body.match(
            /var InstrumentStateData=\[(.*?)\];/m
          );
          if (!instrumentStateData) {
            return reject("dont get instrumentStateData");
          }

          instrumentStateData[1].split("],").forEach((it) => {
            const d = it.split(",");
            const date = d[0].replace("[", "");

            instrumentList.push({
              date: `${date.substring(0, 4)}-${date.substring(
                4,
                6
              )}-${date.substring(6, 8)}`,
              time: d[1] !== "1" ? fixTime(d[1]) : "",
              status: d[2].replace(/'/g, "").replace(/\]/g, "").trim(),
            });
          });

          const clientTypeData = body.match(/var ClientTypeData=\[(.*?)\];/m);
          if (!clientTypeData) {
            return reject("dont get clientTypeData");
          }

          const it = clientTypeData[1].split(",");
          const tradeDetails = {
            noBuyReal: parseInt(it[0], 10),
            noBuyLegal: parseInt(it[1], 10),
            noSellReal: parseInt(it[2], 10),
            noSellLegal: parseInt(it[3], 10),

            volumeBuyReal: parseInt(it[4], 10),
            volumeBuyLegal: parseInt(it[5], 10),
            volumeSellReal: parseInt(it[6], 10),
            volumeSellLegal: parseInt(it[7], 10),

            noTrade: parseInt(closingPriceData[7], 10),
            volumeTrade: parseInt(closingPriceData[8], 10),
          };

          resolve({
            queueList,
            instrumentList,
            tradeDetails,
            baseDetails,
            intraTrade,
          });
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

  static getDetailsByDate(
    id,
    date,
    byCDN3 = true,
    limitQueue = null,
    isToday = false,
    retryCount = 10
  ) {
    return new Promise(async (resolve) => {
      const options = {
        url: `http://${
          byCDN3 ? "cdn3." : isToday ? "cdn." : ""
        }tsetmc.com/Loader.aspx?ParTree=15131P&i=${id}&d=${date.replace(
          /-/g,
          ""
        )}`,
        method: "GET",
        headers: this.headers,
        gzip: true,
        timeout: 10000, // ms
      };

      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getDetailsByDateRequest(
            { ...options, timeout: options.timeout + i - 1 },
            limitQueue
          );
          return resolve(result);
        } catch (e) {
          console.log("retry by date", i, e);
          if (i === retryCount || e === false) {
            return resolve(e === false ? false : null);
          }
          await delay(20);
          continue;
        }
      }
    });
  }

  static getDetailsSymbolRequest(options) {
    return new Promise((resolve, reject) => {
      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          console.log("get data by symbol");

          const kAjCapValCpsIdx = body.match(/KAjCapValCpsIdx='([0-9]+)'/m);
          const estimatedEPS = body.match(/EstimatedEPS='(.*?)'/m);
          const sectorPE = body.match(/SectorPE='(.*?)'/m);
          const zTitad = body.match(/ZTitad=([0-9]+)/m);

          resolve({
            floating: kAjCapValCpsIdx ? parseInt(kAjCapValCpsIdx[1], 10) : 0,
            EPS:
              estimatedEPS && estimatedEPS[1] !== "NotAvailable"
                ? parseInt(estimatedEPS[1], 10)
                : 0,
            groupPE: sectorPE ? advRound(sectorPE[1], 2) : 0,
            PE: 0,
            zTitad: zTitad ? parseInt(zTitad[1], 10) : 0,
          });
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

  static getDetailsSymbol(id, retryCount = 5) {
    return new Promise(async (resolve) => {
      const options = {
        url: `http://www.tsetmc.com/Loader.aspx?ParTree=151311&i=${id}`,
        method: "GET",
        headers: this.headers,
        gzip: true,
        timeout: 10000, // ms
      };

      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getDetailsSymbolRequest({
            ...options,
            timeout: options.timeout + i - 1,
          });

          return resolve(result);
        } catch (e) {
          console.log("retry symbol", i, e);
          if (i === retryCount) {
            return resolve(null);
          }
          await delay(2000);
          continue;
        }
      }
    });
  }

  static getTradeDetailRequest(options) {
    return new Promise((resolve, reject) => {
      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          console.log("get trade by symbol");

          const cells = body.match(/<cell>(.*?)<\/cell>/gm);
          if (!cells) return resolve(null);

          let intraTrade = [];

          let r = 1;
          let item = {};
          cells.forEach((cell) => {
            if (r !== 1) {
              const data = cell.replace("<cell>", "").replace("</cell>", "");
              if (r === 2) {
                item.time = data;
              } else if (r === 3) {
                item.volume = parseInt(data, 10);
              } else if (r === 4) {
                item.price = parseInt(data, 10);
              }
            }
            r++;

            if (r === 5) {
              intraTrade.push(item);
              item = {};
              r = 1;
            }
          });

          intraTrade = intraTrade.sort(
            (a, b) =>
              parseInt(a.time.replace(/:/g, ""), 10) -
              parseInt(b.time.replace(/:/g, ""), 10)
          );

          resolve(intraTrade);
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

  static getTradeDetail(id, retryCount = 5) {
    return new Promise(async (resolve) => {
      const options = {
        url: `http://www.tsetmc.com/tsev2/data/TradeDetail.aspx?i=${id}`,
        method: "GET",
        headers: this.headers,
        gzip: true,
        timeout: 10000, // ms
      };

      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getTradeDetailRequest({
            ...options,
            timeout: options.timeout + i - 1,
          });

          return resolve(result);
        } catch (e) {
          console.log("retry symbol", i, e);
          if (i === retryCount) {
            return resolve(null);
          }
          await delay(2000);
          continue;
        }
      }
    });
  }

  static getQueueByDate(symbol, date, retryCount = 10) {
    return new Promise(async (resolve, reject) => {
      const options = {
        url: `http://cdn.tsetmc.com/Loader.aspx?ParTree=15131P&i=${
          symbol.insCode
        }&d=${date.replace(/-/g, "")}`,
        method: "GET",
        headers: this.headers,
        gzip: true,
        timeout: 10000, // ms
      };

      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getQueueByDateRequest(
            {
              ...options,
              timeout: options.timeout + i - 1,
            },
            symbol,
            date
          );
          return resolve(result);
        } catch (e) {
          console.log("retry by date", i);
          if (i === retryCount || isString(e)) {
            return reject(e);
          }
          await delay(20);
          continue;
        }
      }
    });
  }

  static getQueueByDateRequest(options, symbol, date) {
    return new Promise((resolve, reject) => {
      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          console.log("get data by date");

          /**
           * Trade
           */
          const intraTradeData = body.match(
            /var IntraTradeData=\[\[(.*?)\]\];/m
          );
          if (!intraTradeData) return reject("dont get IntraTradeData");

          const intraSplit = intraTradeData[1].split("],[");
          if (!intraSplit) return reject("error in intraSplit");

          let tradeList = {};
          intraSplit.forEach((intra) => {
            const int = intra.split(",");

            const time = int[1].replace(/'/g, "");
            const volume = parseInt(int[2].replace(/'/g, ""), 10);

            if (!tradeList[time]) tradeList[time] = { volume: 0, count: 0 };
            tradeList[time] = {
              volume: tradeList[time].volume + volume,
              count: tradeList[time].count + 1,
            };
          });
          if (Object.keys(tradeList).length === 0)
            return reject("error in tradeList length is 0");

          /**
           * Queue
           */
          const bestLimitData = body.match(/var BestLimitData=\[(.*?)\];/m);
          if ((bestLimitData && !bestLimitData[1]) || !bestLimitData)
            return reject("dont get bestLimitData");

          let queueList = [];
          bestLimitData[1].split("],").forEach((it) => {
            const d = it.split(",");
            if (d.length === 0) return;
            if (!d[1]) return;
            const pos = parseInt(d[1].replace(/'/g, ""));
            if (pos !== 1) return;

            const time = d[0].replace("[", "");
            const timeFixed = fixTime(time);

            if (queueList.find((q) => q.time === timeFixed)) return;

            const timeMoment = moment(timeFixed, "HH:mm:ss");

            if (
              !timeMoment.isBetween(
                moment("08:29:00", "HH:mm:ss"),
                moment("12:31:00", "HH:mm:ss")
              )
            )
              return;

            const tradeData = tradeList[timeFixed];

            queueList.push({
              name: symbol.name,
              isin: symbol.isin,
              date,
              time: timeFixed,

              noBuy: parseInt(d[2].replace(/'/g, "")),
              volumeBuy: parseInt(d[3].replace(/'/g, "")),
              priceBuy: parseInt(d[4].replace(/'/g, "")),
              priceSell: parseInt(d[5].replace(/'/g, "")),
              volumeSell: parseInt(d[6].replace(/'/g, "")),
              noSell: parseInt(d[7].replace(/'/g, "")),

              volumeTrade: tradeData ? tradeData.volume : 0,
              countTrade: tradeData ? tradeData.count : 0,
            });
          });

          if (queueList.length === 0)
            return reject("error in queueList length is 0");

          resolve({
            queueList,
            tradeList,
          });
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

module.exports = TsetmcApi;
