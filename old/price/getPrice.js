const { getObjectRedis } = require("../helpers/redis");
const { config } = require("../config");

const main = async () => {
  try {
    console.log("requests", config.onlineplus_requests);

    const prices = await getObjectRedis("prices");
    console.log("prices", prices);
  } catch (e) {
    console.log(e);
  }
};

main();
