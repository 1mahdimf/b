const moment = require("jalali-moment");

const { getUnique } = require("../helpers/index");
const { getObjectRedis, setObjectRedis } = require("../helpers/redis");
const { getStockInfo, setHeaders } = require("../helpers/OnlineplusApiOld");
const { config } = require("../config");

const main = async () => {
  try {
    const tomorrowDate = moment().add(1, "days").format("YYYY-MM-DD");

    let prices = await getObjectRedis("prices");
    if (!prices) {
      await setObjectRedis("prices", {
        date: tomorrowDate,
        list: {}
      });
      prices = await getObjectRedis("prices");
    }

    if (prices.date !== tomorrowDate || Object.keys(prices.list).length === 0) {
      const tokens = await getObjectRedis("tokens");

      const onlineToken = tokens.find(
        token =>
          token.type === "onlineplus" && token.user === config.onlineplus_user
      );
      setHeaders(onlineToken.headers);

      const list = await getStocks();

      await setObjectRedis("prices", {
        date: tomorrowDate,
        list
      });
    }
  } catch (e) {
    console.log(e);
  }
};

const getStocks = async () => {
  return new Promise(resolve => {
    const list = {};

    const onlineplusRequests = getUnique(config.onlineplus_requests, "isin");
    onlineplusRequests.forEach(async (item, index) => {
      const details = await getStockInfo(item.isin);

      if (details && details.closingPrice && details.maxPercentChange) {
        const priceHigh = Math.floor(
          details.closingPrice * (1 + details.maxPercentChange / 100)
        );
        const priceLow = Math.ceil(
          details.closingPrice * (1 - details.maxPercentChange / 100)
        );

        list[item.isin] = { priceHigh, priceLow };

        console.log(
          `${moment().format(`YYYY-MM-DD HH:mm`)} - set prices ${item.isin}: ${priceHigh} - ${priceLow}`
        );

        // last item
        if (onlineplusRequests.length === index + 1) {
          return resolve(list);
        }
      }
    });
  });
};

main();
