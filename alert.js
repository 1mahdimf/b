const redisClient = require("redis").createClient();
const nohm = require("nohm").Nohm;

const AlertBotService = require("./services/AlertBotService");
const AnalyzerService = require("./services/AnalyzerService");

redisClient.on("connect", async () => {
  redisClient.select(2);
  nohm.setClient(redisClient);

  const alertBotService = new AlertBotService();

  try {
    AnalyzerService.stockQueue(alertBotService).catch((err) => {
      console.log("Stock queue", err);
    });

    AnalyzerService.stockNazer(alertBotService).catch((err) => {
      console.log("Stock nazer", err);
    });

    // AnalyzerService.stockCodal(alertBotService).catch((err) => {
    //   console.log("Stock codal", err);
    // });

    AnalyzerService.stockStatus(alertBotService).catch((err) => {
      console.log("Stock status", err);
    });
  } catch (e) {
    console.log(e);
  }

  // telegram bot
  alertBotService.bot.on("message", async (ctx) => {
    const reply = ctx.reply;
    const text = ctx.message && ctx.message.text ? ctx.message.text : null;
    const session = ctx.session;
    const fromId = ctx.from.id;

    try {
      // text == /add_alert
      if (await alertBotService.addAlert(fromId, text, session, reply)) return;

      // text == /alert_list
      if (await alertBotService.getAlertList(fromId, text, reply)) return;

      // text == /alert_list_admin
      if (await alertBotService.getAlertListAdmin(fromId, text, reply)) return;

      // text == /alert_delete_(\d+)
      if (await alertBotService.deleteAlertUserById(fromId, text, reply))
        return;

      // session.nextStep = enter_alert_isin_search
      if (await alertBotService.enterAlertIsinSearch(text, session, reply))
        return;

      // session.nextStep = enter_alert_isin
      if (
        await alertBotService.enterAlertIsinAndCreate(
          fromId,
          text,
          session,
          reply
        )
      )
        return;
    } catch (e) {
      console.log(e);
    }
  });

  alertBotService.bot.launch();
});
