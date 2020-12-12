// node easytraderNew.js --isin IR123 --user mfd123 [--type buy] [--price 4500] [--delay 5000] [--run]

const moment = require("jalali-moment");
const argv = require("minimist")(process.argv.slice(2));

const {
  delay,
  log,
  timeMoment,
  calculateQuantityByCredit,
  referenceKeyGenerator
} = require("./helpers/index");
const { getObjectRedis } = require("./helpers/redis");
const { config } = require("./config");

const EasytraderApi = require("./helpers/EasytraderApi");

const isin = argv.isin;
const user = argv.user;
const orderType = argv.type || "buy";

const forcePrice = argv.price;
const forceRun = argv.run;
const forceDelay = argv.delay;

if (!isin || !user) {
  console.log("ERROR, format --isin IR123 --user mfd123");
  process.exit(1);
}

const logFileName = `easytrader-${user}-${moment().format("YYYY-MM-DD")}`;

const main = async () => {
  try {
    const tokens = await getObjectRedis("tokens");
    const prices = await getObjectRedis("prices");

    const requestApi = new EasytraderApi();
    requestApi.isin = isin;
    requestApi.orderType = orderType;

    const foundToken = tokens.find(
      token => token.type === "easytrader" && token.user === user
    );
    requestApi.setHeaders(foundToken.headers);

    const credit = await requestApi.getRemainPriceApi();
    console.log("credit", credit);

    if (credit && credit.accountBalance && credit.accountBalance >= 1000000) {
      if (forcePrice || (prices && prices.list && prices.list[isin])) {
        let price = forcePrice;
        if (!price) {
          price = orderType === "buy"
            ? prices.list[isin].priceHigh
            : prices.list[isin].priceLow;
        }
        requestApi.price = price;

        const quantity = calculateQuantityByCredit(
          credit.accountBalance,
          price
        );
        requestApi.quantity = quantity;

        const logText = `user: ${user} - credit: ${credit.accountBalance} - isin: ${isin} - quantity: ${quantity} - price: ${price}`;
        console.log(logText);
        log(logFileName, logText);

        const bodyData = requestApi.prepareSendOrderBodyData();
        log(logFileName, `BODY DATA - ${JSON.stringify(bodyData)}`);

        const startTimeMoment = timeMoment(config.startTime);
        const endTimeMoment = timeMoment(config.endTime);

        while (true) {
          if (forceRun || moment().isBetween(startTimeMoment, endTimeMoment)) {
            const referenceKey = referenceKeyGenerator();

            log(logFileName, `TIME SEND ORDER - ${referenceKey}`, true);

            requestApi
              .sendOrderApi(referenceKey)
              .then(({ body, refKey }) => {
                // log(logFileName, `BODY ORDER: ${JSON.stringify(bodyData)}`, true);
                log(
                  logFileName,
                  `RESPONSE SEND ORDER: ${refKey} - ${JSON.stringify(body)}`,
                  true
                );
                console.log(refKey, body);
              })
              .catch(({ err, refKey }) => {
                log(logFileName, `CATCH: ${refKey} - ${JSON.stringify(err)}`);
                console.log(refKey, err);
              });
          } else {
            console.log("OUT OF TIME", moment().format("HH:mm:ss SSS"));
          }

          if (forceDelay) {
            await delay(forceDelay);
          } else {
            await delay(config.delay);
          }
        }
      } else {
        log(logFileName, `ERROR PRICE`);
        console.log("ERROR PRICE");
      }
    } else {
      log(logFileName, `ERROR CREDIT: ${JSON.stringify(credit)}`);
      console.log("ERROR CREDIT", credit);
    }
  } catch (e) {
    log(logFileName, `CATCH: ${JSON.stringify(e)}`);
    console.log(e);
  }
};

main();
