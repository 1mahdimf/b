const TadbirApi = require("../helpers/TadbirApi");
const TsetmcApi = require("../helpers/TsetmcApi");
const { delay } = require("../helpers");

const main = async () => {
  const list = await TsetmcApi.getNazerMessageListRepeter(null, true, true);
  console.log("list", list);
  process.exit(0);

  const beforeBuyQuantityList = {};

  while (true) {
    try {
      const list = await TadbirApi.getSybmolDetailsListRepeter();
      console.log("====================================");
      console.log("check", new Date());

      list.forEach((item) => {
        if (!beforeBuyQuantityList[item.isin]) {
          beforeBuyQuantityList[item.isin] = item.bestBuyQuantity;
        }

        if (
          item.highAllowedPrice === item.bestBuyPrice &&
          item.bestBuyQuantity < (beforeBuyQuantityList[item.isin] * 2) / 3
        ) {
          console.log(`${item.isin} - ${item.name}`);
        }

        beforeBuyQuantityList[item.isin] = item.bestBuyQuantity;
      });
    } catch (e) {
      console.log("error", e);
    }

    await delay(1000);
  }
};

main();
