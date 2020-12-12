const TsetmcApi = require("./helpers/TsetmcApi");
const { delay } = require("./helpers/index");

const main = async () => {
  const tsetmcApi = new TsetmcApi();

  while (true) {
    try {
      const data = await tsetmcApi.getSymbolInfo("4384288570322406");
      const buyVolume = data.table[0].buy.volume;
      const sellVolume = data.table[0].sell.volume;

      if (buyVolume / 3 < sellVolume) {
        console.log("VAAAAAYYYY");
      }
    } catch (e) {
      console.log("error", e);
    }

    await delay(60000); // 1 min
  }
};

main();
