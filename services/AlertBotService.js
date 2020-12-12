const Telegraf = require("telegraf");
const session = require("telegraf/session");
const SocksAgent = require("socks5-https-client/lib/Agent");

const TadbirApi = require("../helpers/TadbirApi");
const config = require("../config");
const AnalyzerService = require("../services/AnalyzerService");

class AlertBotService {
  constructor() {
    const options = {};
    if (config.botUseProxy) {
      const socksAgent = new SocksAgent({
        socksHost: config.botProxyHost,
        socksPort: config.botProxyPort,
      });
      options.agent = socksAgent;
    }

    this.bot = new Telegraf(config.alertBotToken, { telegram: options });
    this.bot.use(session());
    this.bot.use(this.useAccess);
  }

  useAccess({ from, reply }, next) {
    if (config.botNotificationUserIds.indexOf(from.id) === -1) {
      console.log("Access deny");
      return false;
    }
    return next();
  }

  async addAlert(fromId, text, session, reply) {
    if (text === "/add_alert") {
      try {
        await AnalyzerService.allowAddNew(fromId);

        session.nextStep = "enter_alert_isin_search";
        reply("نام نماد را برای جستجو وارد کنید", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (err) {
        console.log("addAlert", err);
        reply(err);
      }
      return true;
    }
    return false;
  }

  async enterAlertIsinSearch(text, session, reply) {
    if (session.nextStep === "enter_alert_isin_search") {
      try {
        const searchResult = await TadbirApi.search(text.trim(), true);
        session.searchStock = searchResult;

        reply(
          `نمادهای مورد جستجوی شما پیدا شد در صورت اطمینان نماد خود را از پایین انتخاب کنید`,
          {
            reply_markup: {
              resize_keyboard: true,
              keyboard: searchResult.map((stock) => [
                { text: `${stock.name} - ${stock.isin}` },
              ]),
            },
          }
        );
        session.nextStep = "enter_alert_isin";
      } catch (err) {
        console.log("enterAlertIsinSearch", err);
        reply(err);
      }

      return true;
    }
    return false;
  }

  async enterAlertIsinAndCreate(fromId, text, session, reply) {
    if (session.nextStep === "enter_alert_isin") {
      try {
        const [isinName, isin] = text.split("-");

        const foundStock = session.searchStock.find(
          (stock) => stock.isin === isin.trim()
        );

        if (foundStock) {
          await AnalyzerService.add(fromId, {
            isin: isin.trim(),
            isinName: isinName.trim(),
            insCode: foundStock.insCode,
          });
          reply(
            `نماد #${isinName} در سیستم هشدار اضافه شد\n\n✅ هشدار صف خرید فعال شد\n✅ هشدار حجم صف خرید فعال شد\n✅ ارسال پیام‌های ناظر فعال شد\n✅ ارسال اطلاعیه‌های کدال فعال شد\n✅ هشدار تغییر وضعیت نماد فعال شد\n\nاز طریق لیست هشدارها می‌توانید آن‌ها را مدیریت کنید\n/alert_list`,
            {
              reply_markup: {
                remove_keyboard: true,
              },
            }
          );
          session.nextStep = null;
        } else {
          reply("insCode not found", {
            reply_markup: {
              remove_keyboard: true,
            },
          });
        }
      } catch (err) {
        console.log("enterAlertIsinAndCreate", err);
        reply(err);
      }

      return true;
    }
    return false;
  }

  async deleteAlertUserById(fromId, text, reply) {
    const match = text.match(/^\/alert_delete_(\d+)$/i);
    if (match) {
      try {
        const userAlertId = parseInt(match[1], 10);

        await AnalyzerService.deleteUserAlert(userAlertId, fromId);

        reply("حذف شد", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (err) {
        console.log("deleteAlertUserById", err);
        reply(err);
      }
      return true;
    }
    return false;
  }

  async getAlertList(fromId, text, reply) {
    if (text === "/alert_list") {
      try {
        const userAnalyzerList = await AnalyzerService.listForUser(fromId);

        const analyzerData = userAnalyzerList.map((userAnalyzer) => {
          return `${userAnalyzer.analyzer.isinName}\n🗑 /alert_delete_${userAnalyzer.id}`;
        });

        reply(analyzerData.join("\n===================\n"), {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (err) {
        console.log("getAlertList", err);
        reply(err);
      }
      return true;
    }
    return false;
  }

  async getAlertListAdmin(fromId, text, reply) {
    if (
      text === "/alert_list_admin" &&
      config.botAdminIds.indexOf(fromId) !== -1
    ) {
      try {
        const list = await AnalyzerService.listAdmin();

        const analyzerData = list.map((item) => {
          return `#${item.isinName}\n📈 ${
            item.usersCount
          } نفر\n👨🏻 ${item.users.join(" - ")}`;
        });

        reply(analyzerData.join("\n===================\n"), {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (err) {
        console.log("getAlertList", err);
        reply(err);
      }
      return true;
    }
    return false;
  }
}

module.exports = AlertBotService;
