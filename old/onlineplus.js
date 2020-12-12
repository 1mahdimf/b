/**
 * node onlineplus.js
 *  --isin IR123
 *  --user mfd123
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
} = require("./helpers/index");
const { getObjectRedis } = require("./helpers/redis");
const { config } = require("./config");

const TadbirApi = require("./helpers/TadbirApi");
const OnlineplusApi = require("./helpers/OnlineplusApi");

const isin = argv.isin;
const user = argv.user.toString();
const orderType = argv.type || "buy";
const broker = argv.broker || "mofid";

const forcePrice = argv.price;
const forceQuantity = argv.quantity;
const startTime = argv.start || config.startTime;
const endTime = argv.end || config.endTime;
const forceRun = argv.run;
const forceDelay = argv.delay;

if (!isin || !user) {
  console.log("ERROR, format --isin IR123 --user mfd123");
  process.exit(1);
}

const logFileName = `${broker}-${user}-${moment().format("YYYY-MM-DD")}`;

const main = async () => {
  try {
    const tokens = await getObjectRedis("tokens");
    const prices = await getObjectRedis("prices");

    const requestApi = new OnlineplusApi(broker);
    requestApi.isin = isin;
    requestApi.orderType = orderType;

    const foundToken = tokens.find(
      (token) =>
        token.type === "onlineplus" &&
        token.broker === broker &&
        token.user === user
    );
    requestApi.setHeaders(foundToken.headers);

    let credit = { accountBalance: 100000000 };
    if (orderType === "buy") {
      credit = await requestApi.getRemainPriceApi();
      console.log("credit", credit);
    }

    if (credit && credit.accountBalance && credit.accountBalance >= 1000000) {
      if (forcePrice || (prices && prices.list && prices.list[isin])) {
        let price = forcePrice;
        if (!price) {
          price =
            orderType === "buy"
              ? prices.list[isin].priceHigh
              : prices.list[isin].priceLow;
        }
        requestApi.price = price;

        let quantity = forceQuantity;
        if (!quantity) {
          if (orderType === "buy") {
            quantity = calculateQuantityByCredit(credit.accountBalance, price);
          } else {
            const portfolio = await requestApi.getPortfolioSymbol();
            quantity = portfolio.count;
          }
        }

        let sybmolInfo;
        if (orderType === "buy") {
          sybmolInfo = await TadbirApi.getSybmolInfo(isin);
        }

        if (
          sybmolInfo &&
          parseInt(quantity, 10) > parseInt(sybmolInfo.mxp, 10)
        ) {
          requestApi.quantity = parseInt(sybmolInfo.mxp, 10);
        } else {
          requestApi.quantity = quantity;
        }

        const logText = `user: ${user} - credit: ${credit.accountBalance} - isin: ${requestApi.isin} - quantity: ${requestApi.quantity} - price: ${requestApi.price}`;
        console.log(logText);
        log(logFileName, logText);

        const options = requestApi.prepareSendOrderOption();
        log(logFileName, `OPTION - ${JSON.stringify(options)}`);

        const startTimeMoment = timeMoment(startTime);
        const endTimeMoment = timeMoment(endTime);

        let num = 1;
        while (true) {
          if (forceRun || moment().isBetween(startTimeMoment, endTimeMoment)) {
            log(logFileName, `TIME SEND ORDER - num_${num}`, true);

            requestApi
              .sendOrderApi(num)
              .then(({ body, number }) => {
                // log(logFileName, `BODY ORDER: ${JSON.stringify(bodyData)}`, true);
                log(
                  logFileName,
                  `RESPONSE SEND ORDER: num_${number} - ${JSON.stringify(
                    body
                  )}`,
                  true
                );
                console.log(`num_${number}`, body);
              })
              .catch(({ err, number }) => {
                log(
                  logFileName,
                  `CATCH: num_${number} - ${JSON.stringify(err)}`
                );
                console.log(`num_${number}`, err);
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
