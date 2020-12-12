const TsetmcApi = require("../helpers/TsetmcApi");
const TadbirApi = require("../helpers/TadbirApi");

const main = async () => {
  try {
    const isin = "IRO1OFRS0001";

    const symbolDetails = await TadbirApi.search(isin, true);
    const insCode = symbolDetails[0].insCode;

    console.log("symbolDetails", symbolDetails);

    const result = await TsetmcApi.getNazerMessageList(insCode, true);

    console.log("result", result);
  } catch (e) {
    console.log(e);
  }
};

main();
