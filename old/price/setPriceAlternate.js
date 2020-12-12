const moment = require("jalali-moment");

const { getObjectRedis, setObjectRedis } = require("../helpers/redis");
const { getStockInfo, setHeaders } = require("../helpers/EasytraderApi");
const { config } = require("../config");

const main = async () => {
  try {
    const tokens = await getObjectRedis("tokens");

    const foundToken = tokens.find(
      token =>
        token.type === "easytrader" && token.user === config.easytrader_user
    );
    setHeaders(foundToken.headers);

    const details = await getStockInfo(config.isin);

    if (details && details.closingPrice && details.maxPercentChange) {
      const priceHigh = Math.floor(
        details.closingPrice * (1 + details.maxPercentChange / 100)
      );
      const priceLow = Math.ceil(
        details.closingPrice * (1 - details.maxPercentChange / 100)
      );

      await setObjectRedis("price", { priceHigh, priceLow });
      console.log(
        `${moment().format(`YYYY-MM-DD HH:mm`)} - set prices alternate`
      );
    }
  } catch (e) {
    console.log(e);
  }
};

main();
