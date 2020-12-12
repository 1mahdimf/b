const moment = require("jalali-moment");
const nohm = require("nohm").Nohm;

const { digit, currency, delay, timeMoment } = require("../helpers");
const Nazer = require("../models/Nazer");
const TsetmcApi = require("../helpers/TsetmcApi");

const config = require("../config/index");

class NazerService {
  constructor() {}

  static async get(botService) {
    return new Promise(async () => {
      const startTimeMomentNazer = timeMoment("06:00:00");
      const endTimeMomentQueueNazer = timeMoment("20:00:00");
      const fastStartTimeMomentNazer = timeMoment("08:00:00");
      const fastEndTimeMomentNazer = timeMoment("14:00:00");

      try {
        while (true) {
          const store = await this.findOrAdd();

          try {
            if (
              moment().isBetween(
                startTimeMomentNazer,
                endTimeMomentQueueNazer
              ) &&
              [4, 5].indexOf(moment().day()) === -1
            ) {
              console.log("nazer");

              const result = await TsetmcApi.getNazerMessageListRepeter();

              const lastStoreMoment = moment(
                store.lastAt,
                "YYYY-MM-DD HH:mm:ss"
              );

              if (result.length > 0) {
                let lastAt = null;

                for (let j = result.length - 1; j >= 0; j--) {
                  let message = result[j];

                  if (
                    moment(message.dateTime, "YYYY-MM-DD HH:mm:ss").isAfter(
                      lastStoreMoment
                    )
                  ) {
                    lastAt = message.dateTime;

                    for (let u = 0; u < config.botNazerUserIds.length; u++) {
                      try {
                        await botService.bot.telegram.sendMessage(
                          config.botNazerUserIds[u],
                          `${
                            message.symbols.length > 0
                              ? `📈 ${message.symbols
                                  .map((s) => `#${s}`)
                                  .join(" - ")}\n\n`
                              : ""
                          }${
                            message.types.length > 0
                              ? `🔬 ${message.types
                                  .map((s) => `#${s}`)
                                  .join(" - ")}\n\n`
                              : ""
                          }🔖 ${message.title}\n\n⌚️ ${
                            message.orginalDateTime
                          }\n✉️ ${message.text}`
                        );
                      } catch (err) {
                        console.log(`خطا در تلگرام stock nazer`, err);
                        continue;
                      }
                    }
                  }
                }

                if (lastAt) {
                  await this.update(store.id, {
                    lastAt,
                  });
                }
              }
            }
          } catch (e) {
            console.log(`خطا در stock nazer`, e);
            continue;
          }

          if (
            moment().isBetween(fastStartTimeMomentNazer, fastEndTimeMomentNazer)
          ) {
            await delay(1000 * 60);
          } else {
            await delay(1000 * 60 * 5);
          }
        }
      } catch (e) {
        console.log(`خطا در stock nazer`, e);
      }
    });
  }

  static async update(id, updateValues) {
    try {
      const foundNazer = await Nazer.load(id);
      foundNazer.property(updateValues);

      await foundNazer.save();
      return foundNazer;
    } catch (e) {
      throw e;
    }
  }

  static async findOrAdd() {
    try {
      const items = await Nazer.findAndLoad();
      if (items.length === 0) {
        const row = await this.add();
        return row;
      }

      return {
        ...items[0].allProperties(),
        id: parseInt(items[0].id, 10),
      };
    } catch (e) {
      throw e;
    }
  }

  static async add() {
    try {
      const nazer = new Nazer();
      nazer.property({
        lastAt: moment().subtract(1, "d").format("YYYY-MM-DD HH:mm:ss"),
      });

      await nazer.save();

      const items = await Nazer.findAndLoad();
      return {
        ...items[0].allProperties(),
        id: parseInt(items[0].id, 10),
      };
    } catch (e) {
      throw e;
    }
  }
}

module.exports = NazerService;
