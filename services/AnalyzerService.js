const moment = require("jalali-moment");
const nohm = require("nohm").Nohm;

const { digit, currency, delay, timeMoment } = require("../helpers");
const Analyzer = require("../models/Analyzers");
const UserAnalyzer = require("../models/UserAnalyzer");
const TadbirApi = require("../helpers/TadbirApi");
const TsetmcApi = require("../helpers/TsetmcApi");
const CodalApi = require("../helpers/CodalApi");

const config = require("../config/index");

const userList = config.botNotificationUserIds;

const queueTypeList = {
  buy: {
    title: "صف خرید شد",
    emoji: "💃🏻",
  },
  sell: {
    title: "صف فروش شد",
    emoji: "😭",
  },
  verge_spilled: {
    title: "در آستانه ریزش صف خرید",
    emoji: "😬",
  },
  verge_gathered: {
    title: "در آستانه جمع شدن صف فروش",
    emoji: "🙂",
  },
  verge_buy: {
    title: "در آستانه صف خرید شدن",
    emoji: "😎",
  },
  verge_sell: {
    title: "در آستانه صف فروش شدن",
    emoji: "😢",
  },
  spilled: {
    title: "صف خرید ریخت",
    emoji: "😳",
  },
  gathered: {
    title: "صف فروش جمع شد",
    emoji: "😀",
  },
};

class AnalyzerService {
  constructor() {}

  static async stockQueue(botService) {
    return new Promise(async () => {
      const startTimeMomentQueue = timeMoment("08:40:00");
      const endTimeMomentQueue = timeMoment("12:30:00");
      const fastStartTimeMomentQueue = timeMoment("08:50:00");
      const fastEndTimeMomentQueue = timeMoment("09:05:00");

      while (true) {
        if (
          moment().isBetween(startTimeMomentQueue, endTimeMomentQueue) &&
          [4, 5].indexOf(moment().day()) === -1
        ) {
          console.log("analyzer queue");

          try {
            const list = await this.list();
            const dataList = await TadbirApi.getSybmolDetailsListRepeter();

            let checkList = [];
            list.forEach(item => {
              const data = dataList.find(d => d.isin === item.isin);
              if (data) checkList.push({ data, item });
            });

            for (let i = 0; i < checkList.length; i++) {
              let { data, item } = checkList[i];
              if (item.lastQueueType === "") item.lastQueueType = "buy";

              let newQueueType = null;

              // mojaz
              if (data.status.code === "A" || data.status.code === "AR") {
                if (data.bestBuyPrice === data.highAllowedPrice) {
                  if (data.bestBuyQuantity / 3 < data.bestSellQuantity) {
                    newQueueType = "verge_spilled";
                  } else {
                    newQueueType = "buy";
                  }
                } else if (data.bestSellPrice === data.lowAllowedPrice) {
                  if (data.bestBuyQuantity > data.bestSellQuantity * 2) {
                    newQueueType = "verge_gathered";
                  } else {
                    newQueueType = "sell";
                  }
                } else {
                  if (
                    ["buy", "verge_spilled"].indexOf(item.lastQueueType) !==
                      -1 && data.bestBuyPrice < data.highAllowedPrice
                  ) {
                    newQueueType = "spilled";
                  }

                  if (
                    ["sell", "verge_gathered"].indexOf(item.lastQueueType) !==
                      -1 && data.bestSellPrice > data.lowAllowedPrice
                  ) {
                    newQueueType = "gathered";
                  }

                  if (
                    [
                      "sell",
                      "verge_gathered",
                      "verge_sell",
                      "gathered",
                    ].indexOf(item.lastQueueType) !== -1 &&
                    data.highAllowedPrice / data.bestBuyPrice < 1.01
                  ) {
                    newQueueType = "verge_buy";
                  }

                  if (
                    ["buy", "verge_spilled", "verge_buy", "spilled"].indexOf(
                      item.lastQueueType
                    ) !== -1 && data.bestSellPrice / data.lowAllowedPrice < 1.01
                  ) {
                    newQueueType = "verge_sell";
                  }
                }
              }

              if (newQueueType && newQueueType !== item.lastQueueType) {
                await this.update(item.id, {
                  // lastAlertAt: moment().format("YYYY-MM-DD HH:mm:ss"),
                  lastQueueType: newQueueType,
                });

                // const percent =
                //   5 -
                //   ((data.highAllowedPrice / data.bestSellPrice).toFixed(2) -
                //     1) *
                //     100;

                const telegramIds = await this.findTelegramIdsByAnalyzerId(
                  item.id
                );
                for (let u = 0; u < telegramIds.length; u++) {
                  try {
                    await botService.bot.telegram.sendMessage(
                      telegramIds[u],
                      `#${item.isinName}\n${queueTypeList[newQueueType].emoji} ${queueTypeList[newQueueType].title}\n\nآستانه قیمت بالا: ${currency(data.highAllowedPrice)}\nقیمت آخرین معامله: ${currency(data.lastTradedPrice)} [${data.lastTradedPricePercent.toFixed(2)}%]\nقیمت پایانی: ${currency(data.closingPrice)} [${data.closingPricePercent.toFixed(2)}%]\n\nخرید:\n👥 ${data.bestBuyPrice >= data.lowAllowedPrice ? digit(data.noBestBuy) : 0} | 🛒 ${data.bestBuyPrice >= data.lowAllowedPrice ? digit(data.bestBuyQuantity) : 0} | 💰 ${currency(data.bestBuyPrice >= data.lowAllowedPrice ? data.bestBuyPrice : data.lowAllowedPrice)}\n\nفروش:\n👥 ${digit(data.noBestSell)} | 🛒 ${digit(data.bestSellQuantity)} | 💰 ${currency(data.bestSellPrice)}\n.`
                    );
                  } catch (err) {
                    console.log(`خطا در تلگرام stock queue`, err);
                    continue;
                  }
                }
              }
            }
          } catch (e) {
            console.log(`خطا در stock queue`, e);
          }
        }

        if (
          moment().isBetween(fastStartTimeMomentQueue, fastEndTimeMomentQueue)
        ) {
          await delay(1000 * 10);
        } else {
          await delay(1000 * 20);
        }
      }
    });
  }

  static async stockStatus(botService) {
    return new Promise(async () => {
      const startTimeMomentStatus = timeMoment("09:05:00");
      const endTimeMomentStatus = timeMoment("12:30:00");

      while (true) {
        if (
          moment().isBetween(startTimeMomentStatus, endTimeMomentStatus) &&
          [4, 5].indexOf(moment().day()) === -1
        ) {
          console.log("analyzer status");

          const list = await this.list();

          for (let i = 0; i < list.length; i++) {
            let item = list[i];

            try {
              const symbolInfoTset = await TsetmcApi.getSymbolInfo(
                item.insCode
              );

              if (item.lastStatus !== symbolInfoTset.status) {
                await this.update(item.id, {
                  lastStatus: symbolInfoTset.status,
                });

                const telegramIds = await this.findTelegramIdsByAnalyzerId(
                  item.id
                );
                for (let u = 0; u < telegramIds.length; u++) {
                  try {
                    await botService.bot.telegram.sendMessage(
                      telegramIds[u],
                      `تغییر وضعیت نماد #${item.isinName}\nوضعیت قدیم: ${config.statusList[item.lastStatus] || item.lastStatus}\nوضعیت جدید: ${config.statusList[symbolInfoTset.status] || symbolInfoTset.status}`
                    );
                  } catch (err) {
                    console.log(`خطا در تلگرام stock status`, err);
                    continue;
                  }
                }
              }
            } catch (e) {
              console.log(`خطا در stock status`, e);
              continue;
              // botService.bot.telegram.sendMessage(
              //   config.botAdminIds[0],
              //   `خطا در stock status\n${isString(e) ? e : JSON.stringify(e)}`
              // );
            }
          }
        }

        await delay(1000 * 60);
      }
    });
  }

  static async stockNazer(botService) {
    return new Promise(async () => {
      const startTimeMomentNazer = timeMoment("06:00:00");
      const endTimeMomentQueueNazer = timeMoment("20:00:00");
      const fastStartTimeMomentNazer = timeMoment("08:00:00");
      const fastEndTimeMomentNazer = timeMoment("14:00:00");

      while (true) {
        if (
          moment().isBetween(startTimeMomentNazer, endTimeMomentQueueNazer) &&
          [4, 5].indexOf(moment().day()) === -1
        ) {
          console.log("analyzer nazer");

          const list = await this.list();

          for (let i = 0; i < list.length; i++) {
            let item = list[i];

            const lastStoreMoment = moment(
              item.lastNazerAt,
              "YYYY-MM-DD HH:mm:ss"
            );

            try {
              const symbolDetails = await TadbirApi.search(item.isin, true);
              const insCode = symbolDetails[0].insCode;

              const res = await TsetmcApi.getNazerMessageListRepeter(
                insCode,
                true
              );

              if (res.length > 0) {
                let lastNazerAt = null;

                for (let j = res.length - 1; j >= 0; j--) {
                  let message = res[j];

                  if (
                    moment(message.dateTime, "YYYY-MM-DD HH:mm:ss").isAfter(
                      lastStoreMoment
                    )
                  ) {
                    lastNazerAt = message.dateTime;

                    const telegramIds = await this.findTelegramIdsByAnalyzerId(
                      item.id
                    );
                    for (let u = 0; u < telegramIds.length; u++) {
                      try {
                        await botService.bot.telegram.sendMessage(
                          telegramIds[u],
                          `پیام ناظر نماد #${item.isinName}\n\n${message.title}\n${message.orginalDateTime}\n${message.text}`
                        );
                      } catch (err) {
                        console.log(`خطا در تلگرام stock nazer`, err);
                        continue;
                      }
                    }
                  }
                }

                if (lastNazerAt) {
                  await this.update(item.id, {
                    lastNazerAt,
                  });
                }
              }
            } catch (e) {
              console.log(`خطا در stock nazer`, e);
              continue;
              // botService.bot.telegram.sendMessage(
              //   config.botAdminIds[0],
              //   `خطا در stock nazer\n${isString(e) ? e : JSON.stringify(e)}`
              // );
            }
          }
        }

        if (
          moment().isBetween(fastStartTimeMomentNazer, fastEndTimeMomentNazer)
        ) {
          await delay(1000 * 60);
        } else {
          await delay(1000 * 60 * 10);
        }
      }
    });
  }

  static async stockCodal(botService) {
    return new Promise(async () => {
      const startTimeMomentCodal = timeMoment("06:00:00");
      const endTimeMomentQueueCodal = timeMoment("20:00:00");
      const fastStartTimeMomentCodal = timeMoment("08:00:00");
      const fastEndTimeMomentCodal = timeMoment("14:00:00");

      while (true) {
        if (
          moment().isBetween(startTimeMomentCodal, endTimeMomentQueueCodal) &&
          [4, 5].indexOf(moment().day()) === -1
        ) {
          console.log("analyzer codal");

          const list = await this.list();

          for (let i = 0; i < list.length; i++) {
            let item = list[i];

            const lastStoreMoment = moment(
              item.lastCodalAt,
              "YYYY-MM-DD HH:mm:ss"
            );

            try {
              const data = await CodalApi.getStatementListRepeter(
                item.codalId,
                true
              );
              const lastResult = data.result;

              if (lastResult && lastResult.length > 0) {
                let lastCodalAt = null;

                for (let j = lastResult.length - 1; j >= 0; j--) {
                  const statement = lastResult[j];

                  const toGeorgian = moment(
                    statement.send_date,
                    "jYYYY/jMM/jDD HH:mm:ss"
                  );

                  if (toGeorgian.isAfter(lastStoreMoment)) {
                    lastCodalAt = toGeorgian.format("YYYY-MM-DD HH:mm:ss");

                    const telegramIds = await this.findTelegramIdsByAnalyzerId(
                      item.id
                    );
                    for (let u = 0; u < telegramIds.length; u++) {
                      try {
                        await botService.bot.telegram.sendMessage(
                          telegramIds[u],
                          `اطلاعیه کدال نماد #${item.isinName}\n\n${statement.title}\n${statement.send_date}\n${statement.html_link}\n${statement.link}`
                        );
                      } catch (err) {
                        console.log(`خطا در تلگرام stock codal`, err);
                        continue;
                      }
                    }
                  }
                }

                if (lastCodalAt) {
                  await this.update(item.id, {
                    lastCodalAt,
                  });
                }
              }
            } catch (e) {
              console.log(`خطا در stock codal`, e);
              continue;
              // botService.bot.telegram.sendMessage(
              //   config.botAdminIds[0],
              //   `خطا در stock codal\n${isString(e) ? e : JSON.stringify(e)}`
              // );
            }
          }
        }

        if (
          moment().isBetween(fastStartTimeMomentCodal, fastEndTimeMomentCodal)
        ) {
          await delay(1000 * 60 * 5);
        } else {
          await delay(1000 * 60 * 30);
        }
      }
    });
  }

  static async findIdByIsin(isin) {
    try {
      const ids = await Analyzer.find({
        isin,
      });

      if (ids.length === 0) {
        return null;
      }

      return ids[0];
    } catch (e) {
      throw e;
    }
  }

  static async findByUserIdAndAnalyzerId(telegramId, analyzerId) {
    try {
      const ids = await UserAnalyzer.find({
        analyzerId,
        telegramId,
      });

      if (ids.length === 0) {
        return null;
      }

      return ids[0];
    } catch (e) {
      throw e;
    }
  }

  static async findTelegramIdsByAnalyzerId(analyzerId) {
    try {
      const list = await UserAnalyzer.findAndLoad({ analyzerId });

      if (list.length === 0) {
        return [];
      }

      return list.map(l => l.allProperties().telegramId);
    } catch (e) {
      throw e;
    }
  }

  static async update(id, updateValues) {
    try {
      const foundAnalyzer = await Analyzer.load(id);
      foundAnalyzer.property(updateValues);

      await foundAnalyzer.save();
      return foundAnalyzer;
    } catch (e) {
      throw e;
    }
  }

  static async deleteUserAlert(userAlertId, telegramId) {
    try {
      const found = await UserAnalyzer.load(userAlertId);
      if (!found) {
        throw "نماد مورد نظر برای حذف در سیستم پیدا نشد";
      }
      const foundItem = found.allProperties();

      if (foundItem.telegramId !== telegramId) {
        throw "فضولی نکن 😈";
      }

      const userAnalyzerItem = await nohm.factory("UserAnalyzer");
      userAnalyzerItem.id = userAlertId;
      await userAnalyzerItem.remove({ silent: true });

      const remainUsersForSymbol = await UserAnalyzer.find({
        analyzerId: parseInt(foundItem.analyzerId, 10),
      });

      if (remainUsersForSymbol.length === 0) {
        const analyzerItem = await nohm.factory("Analyzers");
        analyzerItem.id = parseInt(foundItem.analyzerId, 10);
        await analyzerItem.remove({ silent: true });
      }

      return true;
    } catch (e) {
      throw e;
    }
  }

  static async addInUserAnalyzer(telegramId, analyzerId) {
    try {
      const userAnalyzer = new UserAnalyzer();
      const attr = {
        telegramId,
        analyzerId,
      };
      userAnalyzer.property(attr);

      await userAnalyzer.save();
    } catch (e) {
      throw e;
    }
  }

  static async add(telegramId, values) {
    try {
      let analyzerId = await this.findIdByIsin(values.isin);

      if (analyzerId) {
        const userAnalyzer = await this.findByUserIdAndAnalyzerId(
          telegramId,
          parseInt(analyzerId, 10)
        );
        if (userAnalyzer) {
          throw "نماد تکراری\nشما این نماد را در لیست خود دارید";
        }

        await this.addInUserAnalyzer(telegramId, parseInt(analyzerId, 10));
        return true;
      }

      // const codalData = await CodalApi.search(values.isinName);

      const createdAt = moment().subtract(1, "d").format("YYYY-MM-DD HH:mm:ss");

      const analyzer = new Analyzer();
      const attr = {
        ...values,
        codalId: null, // codalData.id,
        lastAlertAt: createdAt,
        lastNazerAt: createdAt,
        lastCodalAt: createdAt,
        lastStatus: "",
      };
      analyzer.property(attr);

      await analyzer.save();
      await this.addInUserAnalyzer(telegramId, parseInt(analyzer.id, 10));

      return true;
    } catch (e) {
      throw e;
    }
  }

  static async list() {
    try {
      const analyzers = await Analyzer.findAndLoad();
      if (analyzers.length === 0) {
        throw "Not found analyzer";
      }

      return analyzers.map(analyzer => ({
        ...analyzer.allProperties(),
        id: parseInt(analyzer.id, 10),
      }));
    } catch (e) {
      throw e;
    }
  }

  static async listForUser(telegramId) {
    try {
      const userAnalyzerList = await UserAnalyzer.findAndLoad({ telegramId });
      if (userAnalyzerList.length === 0) {
        throw "نمادی پیدا نشد";
      }

      const analyzerList = await this.list();

      return userAnalyzerList.map(userAnalyzer => ({
        ...userAnalyzer.allProperties(),
        id: parseInt(userAnalyzer.id, 10),
        analyzer: analyzerList.find(
          a =>
            parseInt(a.id, 10) ===
            parseInt(userAnalyzer.allProperties().analyzerId, 10)
        ),
      }));
    } catch (e) {
      throw e;
    }
  }

  static async listAdmin() {
    try {
      const list = await this.list();

      let result = [];
      for (let i = 0; i < list.length; i++) {
        const item = list[i];

        const usersList = await UserAnalyzer.findAndLoad({
          analyzerId: item.id,
        });
        result.push({
          ...item,
          users: usersList.map(
            u =>
              config.botNotificationUserName[u.allProperties().telegramId] ||
              u.allProperties().telegramId
          ),
          usersCount: usersList.length,
        });
      }

      return result;
    } catch (e) {
      throw e;
    }
  }

  static async listByCondition(condition) {
    try {
      let analyzers = [];
      if (typeof condition === "number") {
        const analyzer = await Analyzer.load(condition); // id
        analyzers = analyzer ? [analyzer] : [];
      } else {
        analyzers = await Analyzer.findAndLoad(condition);
      }

      if (analyzers.length === 0) {
        throw "نمادی پیدا نشد";
      }

      const list = analyzers.map(analyzer => {
        const analyzerData = analyzer.allProperties();

        return {
          ...analyzerData,
          id: parseInt(analyzerData.id, 10),
        };
      });

      return list;
    } catch (e) {
      throw e;
    }
  }

  static async findByIsin(isin) {
    try {
      const list = await this.listByCondition({ isin });
      return list[0];
    } catch (e) {
      throw e;
    }
  }

  static async findById(id) {
    try {
      const list = await this.listByCondition(id);
      return list[0];
    } catch (e) {
      throw e;
    }
  }

  static async allowAddNew(telegramId) {
    return true;

    try {
      if (config.botAdminIds.indexOf(telegramId) !== -1) {
        return true;
      }

      const list = await UserAnalyzer.find({ telegramId });
      if (list.length >= 5) {
        throw "⛔️ شما تنها 5 نماد را می‌توانید در سیستم هشدار ثبت نمایید، می‌توانید از نمادهای دیگر خود حذف نمایید\nاین محدودیت به دلیل جلوگیری از فشار به سرور هشدار می‌باشد.";
      }
      return true;
    } catch (e) {
      throw e;
    }
  }
}

module.exports = AnalyzerService;
