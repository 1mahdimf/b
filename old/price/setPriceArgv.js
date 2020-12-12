const moment = require("jalali-moment");
const argv = require("minimist")(process.argv.slice(2));

const { getObjectRedis, setObjectRedis } = require("../helpers/redis");
const { getStockInfo, setHeaders } = require("../helpers/OnlineplusApiOld");
const { config } = require("../config");

const isin = argv.isin;

const main = async () => {
  try {
    const tomorrowDate = moment()
      .add(1, "days")
      .format("YYYY-MM-DD");

    let prices = await getObjectRedis("prices");
    if (!prices) {
      await setObjectRedis("prices", {
        date: tomorrowDate,
        list: {}
      });
    }

    const tokens = await getObjectRedis("tokens");
    const onlineToken = tokens.find(
      token =>
        token.type === "onlineplus" && token.user === config.onlineplus_user
    );
    setHeaders(onlineToken.headers);

    const details = await getStockInfo(isin);
    if (details && details.closingPrice && details.maxPercentChange) {
      const priceHigh = Math.floor(
        details.closingPrice * (1 + details.maxPercentChange / 100)
      );
      const priceLow = Math.ceil(
        details.closingPrice * (1 - details.maxPercentChange / 100)
      );

      prices = await getObjectRedis("prices");
      prices.list[isin] = { priceHigh, priceLow };

      await setObjectRedis("prices", prices);

      console.log(
        `${moment().format(
          `YYYY-MM-DD HH:mm`
        )} - set prices ${isin}: ${priceHigh} - ${priceLow}`
      );
    }

    process.exit(1);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};

main();
