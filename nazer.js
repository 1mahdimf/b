const redisClient = require("redis").createClient();
const nohm = require("nohm").Nohm;

const NazerBotService = require("./services/NazerBotService");
const NazerService = require("./services/NazerService");

console.log("start");

redisClient.on("connect", async () => {
  redisClient.select(2);
  nohm.setClient(redisClient);

  console.log("redis start");

  const nazerBotService = new NazerBotService();

  try {
    NazerService.get(nazerBotService).catch((err) => {
      console.log("Stock nazer", err);
    });
  } catch (e) {
    console.log(e);
  }

  nazerBotService.bot.launch();
});
