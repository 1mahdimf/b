const redisClient = require("redis").createClient();
const nohm = require("nohm").Nohm;

const OrderService = require("./services/OrderService");
const UserService = require("./services/UserService");

redisClient.on("connect", async () => {
  redisClient.select(2);
  nohm.setClient(redisClient);

  try {
    const orderResult = await OrderService.sqlBackup();
    console.log("order result", orderResult);

    const userResult = await UserService.sqlBackup();
    console.log("user result", userResult);
  } catch (e) {
    console.log(e);
  }
});
