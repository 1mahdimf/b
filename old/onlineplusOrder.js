/**
 * node onlineplus.js
 *  --user mfd123
 *  [--broker mofid]
 */

const moment = require("jalali-moment");
const argv = require("minimist")(process.argv.slice(2));

const { getObjectRedis } = require("./helpers/redis");
const { config } = require("./config");

const OnlineplusApi = require("./helpers/OnlineplusApi");

const user = argv.user;
const broker = argv.broker || "mofid";

if (!user) {
  console.log("ERROR, format --user mfd123");
  process.exit(1);
}

const main = async () => {
  try {
    const tokens = await getObjectRedis("tokens");

    const requestApi = new OnlineplusApi(broker);

    const foundToken = tokens.find(
      token =>
        token.type === "onlineplus" &&
        token.broker === broker &&
        token.user === user
    );
    requestApi.setHeaders(foundToken.headers);

    const result = await requestApi.getOrderListApi();
    console.log(result);
  } catch (e) {
    console.log(e);
  }
};

main();
