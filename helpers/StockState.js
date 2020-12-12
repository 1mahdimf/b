const moment = require("jalali-moment");

const TadbirSocket = require("./TadbirSocket");
const TadbirApi = require("./TadbirApi");
const TsetmcApi = require("./TsetmcApi");

const { delay } = require("./index");

let isOpen = false;
let openBy = null;
let state = null;

const allowStates = ["A", "AR", "IR", "AS"];

const tsetmcSiteCheck = async (isin) => {
  try {
    const symbolDetails = await TadbirApi.search(isin, true);
    const insCode = symbolDetails[0].insCode;

    while (!isOpen) {
      const data = await TsetmcApi.getSymbolInfo(insCode, 1000);
      console.log(
        "tsetmc_site",
        moment().format(`YYYY-MM-DD HH:mm:ss SSS`),
        data.status
      );

      if (allowStates.indexOf(data.status) !== -1) {
        isOpen = true;
        openBy = "tsetmc_site";
        state = data.status;
        return true;
      }

      await delay(20);
    }
  } catch (e) {
    console.log("tsetmc_site", e);
  }
};

const tadbirApiCheck = async (isin) => {
  try {
    while (!isOpen) {
      const data = await TadbirApi.getStockState(isin);
      console.log(
        "tadbir_api",
        moment().format(`YYYY-MM-DD HH:mm:ss SSS`),
        data.code
      );

      if (allowStates.indexOf(data.code) !== -1) {
        isOpen = true;
        openBy = "tadbir_api";
        state = data.code;
        return true;
      }

      await delay(30);
    }
  } catch (e) {
    console.log("tadbir_api", e);
  }
};

const tadbirSocketCheck = async (isin) => {
  try {
    const tadbirSocket = new TadbirSocket();
    await tadbirSocket.connect();

    tadbirSocket.scribeStockState(isin, ({ success, data, error }) => {
      if (success) {
        console.log(
          "tadbir_socket",
          moment().format(`YYYY-MM-DD HH:mm:ss SSS`),
          data.code
        );

        if (!isOpen && allowStates.indexOf(data.code) !== -1) {
          isOpen = true;
          state = data.code;
          openBy = "tadbir_socket";

          tadbirSocket.unScribeStockState();
          tadbirSocket.disconnect();
        }
      } else {
        console.log("error stock state", error);
      }
    });
  } catch (e) {
    console.log("tadbir_socket", e);
  }
};

module.exports = (isin) => {
  return new Promise(async (resolve) => {
    try {
      tsetmcSiteCheck(isin);
      tadbirSocketCheck(isin);
      tadbirApiCheck(isin);

      while (true) {
        if (isOpen) {
          return resolve({
            isOpen,
            openBy,
            state,
            time: moment().format(`YYYY-MM-DD HH:mm:ss SSS`),
          });
        }
        await delay(5);
      }
    } catch (e) {
      console.log("error", e);
    }
  });
};
