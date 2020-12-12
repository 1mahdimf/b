/**
 * node agah.js
 *  --isin IR123
 *  --user 123
 *  [--broker mofid]
 *  [--type buy]
 *  [--price 4500]
 *  [--quantity 1000]
 *  [--start 08:29:50]
 *  [--end 08:30:30]
 *  [--delay 5000]
 *  [--run]
 */
const moment = require("jalali-moment");
const argv = require("minimist")(process.argv.slice(2));

const {
  delay,
  log,
  timeMoment,
  calculateQuantityByCredit,
  agahCategoryId
} = require("./helpers/index");
const { getObjectRedis } = require("./helpers/redis");
const { config } = require("./config");

const AgahApi = require("./helpers/AgahApi");

const isin = argv.isin;
const user = argv.user;
const orderType = argv.type || "buy";

const forcePrice = argv.price;
const forceQuantity = argv.quantity;
const startTime = argv.start || config.startTime;
const endTime = argv.end || config.endTime;
const forceRun = argv.run;
const forceDelay = argv.delay;

if (!isin || !user) {
  console.log("ERROR, format --isin IR123 --user 123");
  process.exit(1);
}

const logFileName = `agah-${user}-${moment().format("YYYY-MM-DD")}`;

const main = async () => {
  try {
    const tokens = await getObjectRedis("tokens");
    const prices = await getObjectRedis("prices");

    const requestApi = new AgahApi();
    requestApi.isin = isin;
    requestApi.orderType = orderType;

    // const foundSymbol = config.symbolList.find(
    //   symbolItem => symbolItem.isin === isin
    // );
    // requestApi.isinName = foundSymbol.symbol;

    const foundToken = tokens.find(
      token => token.type === "agah" && parseInt(token.user, 10) === user
    );
    requestApi.setHeaders(foundToken.headers);
    requestApi.customerId = foundToken.user;
    requestApi.customerTitle = foundToken.name;

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

        let quantity = forceQuantity;
        if (!quantity) {
          quantity = calculateQuantityByCredit(credit.accountBalance, price);
        }
        requestApi.quantity = quantity;

        const logText = `user: ${user} - credit: ${credit.accountBalance} - isin: ${isin} - quantity: ${quantity} - price: ${price}`;
        console.log(logText);
        log(logFileName, logText);

        const instrumentInfo = await requestApi.getInstrumentInfo();
        log(logFileName, `INSTRUMENT INFO - ${JSON.stringify(instrumentInfo)}`);

        requestApi.prepareNonceOption();

        const bodyData = requestApi.prepareSendOrderBodyData();
        log(logFileName, `BODY DATA - ${JSON.stringify(bodyData)}`);

        const startTimeMoment = timeMoment(startTime);
        const endTimeMoment = timeMoment(endTime);

        let num = 1;
        while (true) {
          if (forceRun || moment().isBetween(startTimeMoment, endTimeMoment)) {
            const catId = agahCategoryId();

            log(logFileName, `TIME SEND ORDER - ${catId}`, true);

            requestApi
              .generateNonce(catId)
              .then(({ nonce, categoryId }) => {
                log(
                  logFileName,
                  `RESPONSE NONCE: ${categoryId} - ${nonce}`,
                  true
                );
                console.log("generate nonce", categoryId, nonce);

                requestApi
                  .sendOrderApi(nonce, categoryId)
                  .then(({ body, catyId }) => {
                    log(
                      logFileName,
                      `RESPONSE SEND ORDER: ${catyId} - ${JSON.stringify(body)}`,
                      true
                    );
                    console.log(catyId, body);
                  })
                  .catch(({ err, catyId }) => {
                    log(
                      logFileName,
                      `CATCH SEND ORDER: ${catyId} - ${JSON.stringify(err)}`
                    );
                    console.log("catch send order", catyId, err);
                  });
              })
              .catch(({ err, categoryId }) => {
                log(
                  logFileName,
                  `CATCH NONCE: ${categoryId} - ${JSON.stringify(err)}`
                );
                console.log("catch nonce", categoryId, err);
              });

            num++;
            if (num > 10000) process.exit(1);
          } else {
            console.log("OUT OF TIME", moment().format("HH:mm:ss SSS"));

            const endTimeMomentAfter = timeMoment(endTime).add(15, "seconds");
            if (moment().isAfter(endTimeMomentAfter)) {
              process.exit(1);
            }
          }

          if (forceDelay) {
            await delay(forceDelay);
          } else {
            await delay(config.delay);
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
