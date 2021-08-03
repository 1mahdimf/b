const request = require("request");
const config = require("../config");

const { delay } = require("./index");

const data = require("../tadbir.json");

class TadbirApi {
  static getSybmolDetails(isin) {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://core.tadbirrlc.com//StockFutureInfoHandler.ashx?%7B%22Type%22:%22getLightSymbolInfoAndQueue%22,%22la%22:%22Fa%22,%22nscCode%22:%22${isin}%22%7D&jsoncallback=`,
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
        },
      };

      request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const data = JSON.parse(body);
          return resolve(data);
        } else {
          return reject(error);
        }
      });
    });
  }

  static getSybmolDetailsRepeter(isin, retryCount = 5) {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getSybmolDetails(isin);
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

  static getSybmolInfo(isin) {
    return new Promise((resolve, reject) => {
      this.getSybmolDetails(isin).then((data) => {
        return resolve(data.symbolinfo);
      }, reject);
    });
  }

  static getStockState(isin, retryCount = 1000) {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getSybmolDetails(isin);
          if (result && result.symbolinfo && result.symbolinfo.st) {
            return resolve(
              config.statusTadbirToTset[result.symbolinfo.st] || {
                code: null,
                title: null,
              }
            );
          }
          continue;
        } catch (e) {
          if (i === retryCount) {
            return reject(e);
          }
          continue;
        }
      }
    });
  }

  static getSybmolList() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://core.tadbirrlc.com//StocksHandler.ashx?%7B"Type":"allSymbols","la":"Fa"%7D&jsoncallback=`,
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
        },
      };

      request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const data = JSON.parse(body);

          const list = data.map((item) => {
            return {
              isin: item.nc,
              name: item.sf.replace(/ي/g, "ی"),
              description: item.cn,
            };
          });

          resolve(list);
        } else {
          return reject(error);
        }
      });
    });
  }

  static getSybmolDetailsList() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://core.tadbirrlc.com//StocksHandler.ashx?%7B%22Type%22:%22ALL21%22,%22la%22:%22Fa%22%7D&jsoncallback=`,
        headers: {
          Accept: "application/json, text/plain",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
        },
      };

      request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const data = JSON.parse(body);

          const list = data.map((item) => ({
            insCode: item.ic,
            isin: item.nc,
            name: item.sf.replace(/ي/g, "ی"),
            description: item.cn,
            group: groupList[item.sc] || null,
            groupId: item.sc,
            basisVolume: parseInt(item.bv, 10),
            highAllowedPrice: parseInt(item.hap, 10),
            lowAllowedPrice: parseInt(item.lap, 10),
            status: config.statusTadbirToTset[parseInt(item.ss, 10)] || {
              code: null,
              title: null,
            },

            // FINAL PRICE
            closingPrice: parseInt(item.cp, 10),
            closingPricePercent: parseFloat(item.cpvp),
            yesterdayClosingPrice: parseInt(item.pcp, 10),

            // LAST TRADE PRICE
            lastTradedPrice: parseInt(item.ltp, 10),
            lastTradedPricePercent: parseFloat(item.lpvp),

            // BUY QUEUE
            bestBuyPrice: parseInt(item.bbp, 10),
            bestBuyQuantity: parseInt(item.bbq, 10),
            noBestBuy: parseInt(item.nbb, 10),

            // SELL QUEUE
            bestSellPrice: parseInt(item.bsp, 10),
            bestSellQuantity: parseInt(item.bsq, 10),
            noBestSell: parseInt(item.nbs, 10),
          }));

          resolve(list);
        } else {
          return reject(error);
        }
      });
    });
  }

  static getSybmolDetailsListSearch(query) {
    return new Promise((resolve, reject) => {
      const options = {
        url: encodeURI(
          `https://api2.mofidonline.com/Web/V1/Symbol/GetSymbol?term=${query}`
        ),
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
        },
      };

      request(options, async (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const data = JSON.parse(body);

          let list = [];
          for (let i = 0; i < data.length; i++) {
            if (!data[i].isin) continue;
            const info = data[i];

            // const details = await this.getSybmolDetailsRepeter(data[i].isin);
            // const info = details.symbolinfo;

            // list.push({
            //   insCode: info.ic,
            //   isin: info.nc,
            //   name: info.est.trim().replace(/ي/g, "ی"),
            //   description: info.ect,
            //   closingPrice: parseInt(info.cp, 10),
            // });
            const label = info.label.trim().replace(/ي/g, "ی");
            const name = label.split("-");

            list.push({
              insCode: null,
              isin: info.isin,
              name: name[0],
              description: null,
              closingPrice: info.value,
            });
          }

          console.log("list", list);
          resolve(list);
        } else {
          return reject(error);
        }
      });
    });
  }

  static getSybmolDetailsListRepeter(retryCount = 5) {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.getSybmolDetailsList();
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

  static search(query, getDetails = false, limit = 5) {
    return new Promise(async (resolve, reject) => {
      // console.log(query, getDetails);
      try {
        // let list = [];
        // if (getDetails) {
        //   list = await this.getSybmolDetailsList();
        // } else {
        //   list = await this.getSymbolList();
        // }
        // console.log("list", list);

        let findList = [];

        // const regexp = RegExp(`^${query}`);
        // list.forEach((item) => {
        //   if (regexp.test(item.name) || regexp.test(item.isin)) {
        //     findList.push(item);
        //   }
        // });

        if (findList.length === 0) {
          findList = await this.getSybmolDetailsListSearch(query);
        }

        if (findList.length === 0) {
          return reject("Not found");
        }

        resolve(findList.slice(0, limit));
      } catch (err) {
        console.log("tadbir search", err);
        reject(err);
      }
    });
  }

  static getSybmolDetailsListByIsinList(isinList) {
    return new Promise((resolve, reject) => {
      const options = {
        url: `https://core.tadbirrlc.com//StockInformationHandler.ashx?%7B%22Type%22:%22getstockprice2%22,%22la%22:%22Fa%22,%22arr%22:%22${isinList.join(
          ","
        )}%22%7D&jsoncallback=`,
        headers: {
          Accept: "application/json, text/plain, */*",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
        },
      };
      console.log(options.url);
      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200 && body) {
          const data = JSON.parse(body);

          const list = data.map((item) => ({
            insCode: item.ic,
            isin: item.nc,
            name: item.sf.replace(/ي/g, "ی"),
            description: item.cn,
            group: groupList[item.sc] || null,
            groupId: item.sc,
            basisVolume: parseInt(item.bv, 10),
            highAllowedPrice: parseInt(item.hap, 10),
            lowAllowedPrice: parseInt(item.lap, 10),
            status: config.statusTadbirToTset[parseInt(item.ss, 10)] || {
              code: null,
              title: null,
            },

            // FINAL PRICE
            closingPrice: parseInt(item.cp, 10),
            closingPricePercent: parseFloat(item.cpvp),
            yesterdayClosingPrice: parseInt(item.pcp, 10),

            // LAST TRADE PRICE
            lastTradedPrice: parseInt(item.ltp, 10),
            lastTradedPricePercent: parseFloat(item.lpvp),

            // BUY QUEUE
            bestBuyPrice: parseInt(item.bbp, 10),
            bestBuyQuantity: parseInt(item.bbq, 10),
            noBestBuy: parseInt(item.nbb, 10),

            // SELL QUEUE
            bestSellPrice: parseInt(item.bsp, 10),
            bestSellQuantity: parseInt(item.bsq, 10),
            noBestSell: parseInt(item.nbs, 10),
          }));

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
}

const groupList = {
  33: "ابزارپزشکی، اپتیکی و اندازه&zwnj;گیری",
  10: "استخراج زغال سنگ",
  14: "استخراج سایر معادن",
  11: "استخراج نفت گاز و خدمات جنبی جز اکتشاف",
  13: "استخراج کانه های فلزی",
  73: "اطلاعات و ارتباطات",
  52: "انبارداری و حمایت از فعالیتهای حمل و نقل",
  70: "انبوه سازی، املاک و مستغلات",
  22: "انتشار، چاپ و تکثیر",
  76: "اوراق بهادار مبتنی بر دارایی فکری",
  69: "اوراق تامین مالی",
  59: "اوراق حق تقدم استفاده از تسهیلات مسکن",
  57: "بانکها و موسسات اعتباری",
  66: "بیمه وصندوق بازنشستگی به جزتامین اجتماعی",
  45: "پیمانکاری صنعتی",
  46: "تجارت عمده فروشی به جز وسایل نقلیه موتور",
  50: "تجارت عمده وخرده فروشی وسائط نقلیه موتور",
  26: "تولید محصولات کامپیوتری الکترونیکی ونوری",
  41: "جمع آوری، تصفیه و توزیع آب",
  "02": "جنگلداری و ماهیگیری",
  15: "حذف شده- فرآورده&zwnj;های غذایی و آشامیدنی",
  24: "حذف شده-مواد و محصولات شیمیایی",
  61: "حمل و نقل آبی",
  51: "حمل و نقل هوایی",
  60: "حمل ونقل، انبارداری و ارتباطات",
  74: "خدمات فنی و مهندسی",
  47: "خرده فروشی،باستثنای وسایل نقلیه موتوری",
  34: "خودرو و ساخت قطعات",
  19: "دباغی، پرداخت چرم و ساخت انواع پاپوش",
  72: "رایانه و فعالیت&zwnj;های وابسته به آن",
  "01": "زراعت و خدمات وابسته",
  32: "ساخت دستگاه&zwnj;ها و وسایل ارتباطی",
  28: "ساخت محصولات فلزی",
  35: "سایر تجهیزات حمل و نقل",
  54: "سایر محصولات کانی غیرفلزی",
  58: "سایر واسطه گریهای مالی",
  56: "سرمایه گذاریها",
  53: "سیمان، آهک و گچ",
  39: "شرکتهای چند رشته ای صنعتی",
  68: "صندوق سرمایه گذاری قابل معامله",
  40: "عرضه برق، گاز، بخاروآب گرم",
  23: "فراورده های نفتی، کک و سوخت هسته ای",
  77: "فعالبت های اجاره و لیزینگ",
  82: "فعالیت پشتیبانی اجرائی اداری وحمایت کسب",
  71: "فعالیت مهندسی، تجزیه، تحلیل و آزمایش فنی",
  63: "فعالیت های پشتیبانی و کمکی حمل و نقل",
  90: "فعالیت های هنری، سرگرمی و خلاقانه",
  93: "فعالیتهای فرهنگی و ورزشی",
  67: "فعالیتهای کمکی به نهادهای مالی واسط",
  27: "فلزات اساسی",
  38: "قند و شکر",
  98: "گروه اوراق غیرفعال",
  25: "لاستیک و پلاستیک",
  29: "ماشین آلات و تجهیزات",
  31: "ماشین آلات و دستگاه&zwnj;های برقی",
  36: "مبلمان و مصنوعات دیگر",
  20: "محصولات چوبی",
  44: "محصولات شیمیایی",
  42: "محصولات غذایی و آشامیدنی به جز قند و شکر",
  21: "محصولات کاغذی",
  64: "مخابرات",
  17: "منسوجات",
  43: "مواد و محصولات دارویی",
  55: "هتل و رستوران",
  65: "واسطه&zwnj;گری&zwnj;های مالی و پولی",
  49: "کاشی و سرامیک",
};

module.exports = TadbirApi;
