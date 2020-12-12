/**
 * node order.js --id 1
 */

const moment = require("jalali-moment");
const argv = require("minimist")(process.argv.slice(2));

const {
  delay,
  log,
  calculateQuantityByCredit,
  agahCategoryId,
} = require("./helpers/index");

const MyApi = require("./helpers/MyApi");
const TadbirApi = require("./helpers/TadbirApi");
const TsetmcApi = require("./helpers/TsetmcApi");
const OnlineplusApi = require("./helpers/OnlineplusApi");
const AgahApi = require("./helpers/AgahApi");
const ExirApi = require("./helpers/ExirApi");

const main = async () => {
  try {
    const foundOrder = await MyApi.getOrderById(argv.id);

    const logFileName = `${foundOrder.user.broker}-${
      foundOrder.user.key
    }-${moment().format("YYYY-MM-DD")}`;

    let requestApi;
    switch (foundOrder.user.software) {
      case "onlineplus":
        requestApi = new OnlineplusApi(foundOrder.user.broker);
        break;
      case "agah":
        requestApi = new AgahApi(foundOrder.user.broker);
        requestApi.customerId = foundOrder.user.key;
        requestApi.customerTitle = foundOrder.user.name;
        break;
      case "exir":
        requestApi = new ExirApi(foundOrder.user.broker);
        break;
    }

    requestApi.isin = foundOrder.isin;
    requestApi.orderType = foundOrder.side;
    requestApi.price = foundOrder.price;

    requestApi.setHeaders(foundOrder.user.token || {});

    let credit = {};
    let symbolInfo;

    if (foundOrder.side === "buy") {
      credit = await requestApi.getRemainPriceApi();
      console.log("credit", credit);

      symbolInfo = await TadbirApi.getSybmolInfo(requestApi.isin);
    }

    if (
      symbolInfo &&
      parseInt(foundOrder.quantity, 10) > parseInt(symbolInfo.mxp, 10)
    ) {
      requestApi.quantity = parseInt(symbolInfo.mxp, 10);

      // update quantity order by id
      await MyApi.updateById(foundOrder.id, { quantity: requestApi.quantity });
    } else {
      requestApi.quantity = foundOrder.quantity;
    }

    if (requestApi.quantity === 0 || !requestApi.quantity) {
      if (foundOrder.side === "buy") {
        requestApi.quantity = calculateQuantityByCredit(
          credit.accountBalance,
          requestApi.price
        );
      } else {
        const portfolio = await requestApi.getPortfolioSymbol();
        requestApi.quantity = portfolio.count;
      }

      if (!requestApi.quantity) {
        throw new Error("Quantity is zero");
      }

      if (
        foundOrder.side === "buy" &&
        parseInt(requestApi.quantity, 10) > parseInt(symbolInfo.mxp, 10)
      ) {
        requestApi.quantity = parseInt(symbolInfo.mxp, 10);
      }

      // update quantity order by id
      await MyApi.updateById(foundOrder.id, { quantity: requestApi.quantity });
    }

    // log data for start order
    const logText = `user: ${foundOrder.user.key} - credit: ${
      credit.accountBalance || "-"
    } - isin: ${requestApi.isin} - quantity: ${requestApi.quantity} - price: ${
      requestApi.price
    }`;
    console.log(logText);
    log(logFileName, logText);

    if (foundOrder.user.software === "agah") {
      // instrument info
      const instrumentInfo = await requestApi.getInstrumentInfo();
      log(logFileName, `INSTRUMENT INFO - ${JSON.stringify(instrumentInfo)}`);
      // prepare nonce option
      requestApi.prepareNonceOption();
      // prepare send order body data
      const bodyData = requestApi.prepareSendOrderBodyData();
      log(logFileName, `BODY DATA - ${JSON.stringify(bodyData)}`);
    } else {
      // prepare send order option
      const options = requestApi.prepareSendOrderOption();
      log(logFileName, `OPTION - ${JSON.stringify(options)}`);
    }

    const symbolDetails = await TadbirApi.search(foundOrder.isin, true);
    const insCode = symbolDetails[0].insCode;
    console.log("symbolDetails", symbolDetails);

    while (true) {
      const symbolInfoTset = await TsetmcApi.getSymbolInfo(insCode, 1000);

      console.log(
        `${moment().format(`YYYY-MM-DD HH:mm:ss SSS`)} - status: ${
          symbolInfoTset.status
        }`
      );

      let num = 1;
      while (
        (symbolInfoTset.status === "A" || symbolInfoTset.status === "AR") &&
        num <= 500
      ) {
        if (num === 1) {
          // update order status to run
          MyApi.updateById(foundOrder.id, { status: "run" });
        }

        // agah send order
        if (foundOrder.user.software === "agah") {
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
        } else {
          // onlineplus and exir send order
          log(logFileName, `TIME SEND ORDER - num_${num}`, true);

          requestApi
            .sendOrderApi(num)
            .then(({ body, number }) => {
              log(
                logFileName,
                `RESPONSE SEND ORDER: num_${number} - ${JSON.stringify(body)}`,
                true
              );
              console.log(`num_${number}`, body);
            })
            .catch(({ err, number }) => {
              log(logFileName, `CATCH: num_${number} - ${JSON.stringify(err)}`);
              console.log(`num_${number}`, err);
            });
        }

        num++;

        await delay(foundOrder.delay || 20);
      }

      if (symbolInfoTset.status === "A" || symbolInfoTset.status === "AR") {
        console.log("OUT OF TIME", moment().format("HH:mm:ss SSS"));
        break;
      }

      await delay(20);
    }
  } catch (e) {
    log("error-get-user", `CATCH: ${JSON.stringify(e)}`);
    console.log(e);
  }
};

main();
