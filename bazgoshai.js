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
const StockState = require("./helpers/StockState");

const OnlineplusApi = require("./helpers/OnlineplusApi");
const AgahApi = require("./helpers/AgahApi");
const ExirApi = require("./helpers/ExirApi");
const FarabixoApi = require("./helpers/FarabixoApi");

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
      case "farabixo":
        requestApi = new FarabixoApi(foundOrder.user.broker);
    }

    requestApi.isin = foundOrder.isin;
    requestApi.orderType = foundOrder.side;

    // const symbolInfo = await TadbirApi.getSybmolInfo(requestApi.isin);
    // const maxPrice = parseInt(symbolInfo.mxp, 10);

    if (foundOrder.price !== 0) {
      requestApi.price = foundOrder.price;
    }
    // else {
    //   if (foundOrder.side === "buy") {
    //     requestApi.price = parseInt(symbolInfo.ht, 10);
    //   } else {
    //     requestApi.price = parseInt(symbolInfo.lt, 10);
    //   }

    //   // update price order by id
    //   await MyApi.updateById(foundOrder.id, { price: requestApi.price });
    // }

    requestApi.setHeaders(foundOrder.user.token || {});

    let credit = {};

    if (foundOrder.side === "buy") {
      credit = await requestApi.getRemainPriceApi();
      console.log("credit", credit);
    }

    // if (parseInt(foundOrder.quantity, 10) > parseInt(maxPrice, 10)) {
    //   requestApi.quantity = parseInt(maxPrice, 10);

    //   // update quantity order by id
    //   await MyApi.updateById(foundOrder.id, { quantity: requestApi.quantity });
    // } else {
    requestApi.quantity = foundOrder.quantity;
    // }

    if (requestApi.quantity === 0 || !requestApi.quantity) {
      if (foundOrder.side === "buy") {
        requestApi.quantity = calculateQuantityByCredit(
          credit.accountBalance,
          requestApi.price,
          foundOrder.user.software === "exir"
        );
      } else {
        const portfolio = await requestApi.getPortfolioSymbol();
        requestApi.quantity = portfolio.count;
      }

      if (!requestApi.quantity) {
        throw new Error("Quantity is zero");
      }

      // if (
      //   foundOrder.side === "buy" &&
      //   parseInt(requestApi.quantity, 10) > parseInt(maxPrice, 10)
      // ) {
      //   requestApi.quantity = parseInt(maxPrice, 10);
      // }

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

    const stockState = await StockState(requestApi.isin);
    let maxNum = 20;
    if (["IR", "AS"].indexOf(stockState.state) !== -1) maxNum = 1000;

    // update order status to run
    MyApi.updateById(foundOrder.id, { status: "run" });

    let num = 1;
    while (num <= maxNum) {
      // agah send order
      if (foundOrder.user.software === "agah") {
        const catId = agahCategoryId();
        log(logFileName, `TIME SEND ORDER - ${catId}`, true);

        requestApi
          .generateNonce(catId)
          .then(({ nonce, categoryId }) => {
            log(logFileName, `RESPONSE NONCE: ${categoryId} - ${nonce}`, true);
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

    await delay(30 * 1000); // 0.5 min

    console.log("Stock State", stockState);

    console.log(
      foundOrder.id,
      foundOrder.user.name,
      foundOrder.user.key,
      foundOrder.user.broker
    );

    const details = await requestApi.getOrderDetailsApi();
    console.log(
      details.map((d) => {
        if (d.statusType === "done")
          return {
            position: d.position,
            volumetricPosition: d.volumetricPosition,
            statusText: d.status,
            positionCreatedAt: d.createdAt,
          };
      })
    );

    if (details.length > 0) {
      // update position order by id
      await MyApi.updateById(foundOrder.id, {
        position: details[details.length - 1].position,
        volumetricPosition: details[details.length - 1].volumetricPosition,
        positionCreatedAt: details[details.length - 1].createdAt,
        statusText: details[details.length - 1].status,

        result: details.map((d) => {
          if (d.statusType === "done")
            return {
              position: d.position,
              volumetricPosition: d.volumetricPosition,
              statusText: d.status,
              positionCreatedAt: d.createdAt,
            };
        }),
      });

      console.log("exit");
      process.exit(1);
    } else {
      console.log("update failed");
      await MyApi.updateById(foundOrder.id, {
        status: "failed",
      });

      console.log("exit");
      process.exit(1);
    }
  } catch (e) {
    log("error-get-user", `CATCH: ${JSON.stringify(e)}`);
    console.log(e);
  }
};

main();
