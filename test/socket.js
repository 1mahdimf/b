const TadbirSocket = require("../helpers/TadbirSocket");

const main = async () => {
  try {
    const tadbirSocket = new TadbirSocket();
    await tadbirSocket.connect();

    /**
     * subscribe clock
     */
    tadbirSocket.subscribeClock(({ success, data, error }) => {
      if (success) {
        console.log("success clock", data);
      } else {
        console.log("error clock", error);
      }
    });
    // tadbirSocket.unSubscriptionClock();

    /**
     * subscribe order place
     */
    const orderList = [
      {
        orderid: null,
        HostOrderId: null,
        nsccode: null,
        ordersideid: null,
        OrderEntryDate: null,
      },
    ];
    tadbirSocket.subscribeOrderPlace(orderList, ({ success, data }) => {
      if (success) {
        console.log("success order place", data);
      } else {
        console.log("error order place");
      }
    });
    // tadbirSocket.unSubscribeOrderPlace();

    /**
     * subscribe stock state
     */
    tadbirSocket.scribeStockState(
      "IRO1MKBT0001",
      ({ success, data, error }) => {
        if (success) {
          console.log("success stock state", data);
        } else {
          console.log("error stock state", error);
        }
      }
    );
    // tadbirSocket.unScribeStockState();

    // tadbirSocket.disconnect();
  } catch (e) {
    console.log("main error", e);
  }
};

main();
