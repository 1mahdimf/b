const MyApi = require("./helpers/MyApi");
const OnlineplusApi = require("./helpers/OnlineplusApi");

const main = async () => {
  try {
    const foundOrder = await MyApi.getOrderById(2);

    requestApi = new OnlineplusApi(foundOrder.user.broker);
    requestApi.isin = foundOrder.isin;
    requestApi.orderType = foundOrder.side;
    requestApi.price = foundOrder.price;
    requestApi.setHeaders(foundOrder.user.token || {});

    const details = await requestApi.getOrderDetailsApi();
    console.log("details", details);
  } catch (e) {
    console.log(e);
  }
};

main();
