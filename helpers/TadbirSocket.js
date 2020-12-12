const Ls = require("lightstreamer-client");
const config = require("../config");

const brokerIds = {
  mofid: 112,
};

class TadbirSocket {
  constructor() {
    this.brokerId = 112; // mofid broker id
    this.username = "2135211504"; // fake username

    this.client = null;
    this.subClock = null;
    this.subOrderPlace = null;
    this.stockState = null;
  }

  connect(broker = null, user = null) {
    return new Promise((resolve, reject) => {
      if (broker) this.brokerId = brokerIds[broker] || broker;
      if (user) this.username = user;

      this.client = new Ls.LightstreamerClient(
        "https://pushv7.etadbir.com",
        "STOCKLISTDEMO_REMOTE"
      );

      this.client.connectionDetails.setUser(
        this.brokerId + "&" + this.username
      );
      this.client.connectionDetails.setPassword(this.brokerId);

      this.client.addListener({
        onServerError: (err) => {
          console.log("error", err);
          reject(err);
        },
        onStatusChange: (status) => {
          try {
            const st = status.split(":");
            if (st.length > 0) {
              if (st[0] === "CONNECTED") {
                console.log("Connection true");
                resolve("CONNECTED");
              } else {
                console.log("Connection false");
                // reject("DISCONNECT");
              }
            }
            console.log(status);
          } catch (e) {
            console.log("error2", e);
            reject(e);
          }
        },
      });
      this.client.connect();
    });
  }

  disconnect() {
    this.client.disconnect();
  }

  subscriptionToLS(
    mode,
    item,
    userschema,
    adaptername,
    issnapshot,
    calbackFn,
    oldSub
  ) {
    if (oldSub != null) this.unSubscription(oldSub);

    if (typeof issnapshot == "undefined" || issnapshot == null)
      issnapshot = "no";
    if (
      typeof adaptername == "undefined" ||
      adaptername == null ||
      adaptername == ""
    )
      adaptername = "TadbirLightRLC";
    if (typeof userschema == "undefined" || userschema == null)
      userschema = App.Schema;
    if (typeof mode == "undefined" || mode == null) {
      //   if (config.snapshot == "no") mode = "RAW";
      mode = "MERGE";
    }
    if (mode == "RAW") issnapshot = "no";

    const sub = new Ls.Subscription(mode, item, userschema);
    sub.setDataAdapter(adaptername);
    sub.setRequestedSnapshot(issnapshot);
    sub.addListener({
      onSubscription: () => {
        console.log("SUBSCRIBED");
      },
      onUnsubscription: () => {
        console.log("UNSUBSCRIBED");
      },
      onItemUpdate: (updateInfo) => {
        calbackFn(updateInfo);
      },
      onSubscriptionError: (e) => {
        console.log("onSubscriptionError", e);
      },
      // onListenStart: (e) => {
      //   console.log("onListenStart", e);
      // },
      // onListenEnd: (e) => {
      //   console.log("onListenEnd", e);
      // },
      // onItemLostUpdates: (e) => {
      //   console.log("onItemLostUpdates", onItemLostUpdates);
      // },
      // onEndOfSnapshot: (e) => {
      //   console.log("onEndOfSnapshot", onEndOfSnapshot);
      // },
    });
    this.client.subscribe(sub);
    return sub;
  }

  /**
   * Unsubscribe handle
   */
  unSubscription(subscription) {
    if (subscription != null) {
      try {
        if (this.client != null) {
          if (subscription.isActive()) {
            this.client.unsubscribe(subscription);
            return true;
          }
        }
      } catch (e) {
        console.log(e);
        return false;
      }
    }
  }

  /**
   * Simple subscribe
   */
  simpleSubscribe(item, userschema, calbackFn, oldSub, snapshot) {
    return this.subscriptionToLS(
      "MERGE",
      item,
      userschema,
      "TadbirLightRLC",
      snapshot ? snapshot : "yes",
      calbackFn,
      oldSub
    );
  }

  /**
   * Private subscribe
   */
  privateSubscribe(mode, schema, calbackFn, oldSub, allItemSubscribed) {
    const item = [
      `${this.brokerID}_${this.username.replace(
        /-/g,
        "_"
      )}_lightrlc`.toLowerCase(),
    ];
    return this.privateSubscribeFull(
      mode,
      schema,
      item,
      "no",
      calbackFn,
      oldSub,
      allItemSubscribed
    );
  }

  privateSubscribeFull(
    mode,
    schema,
    items,
    isSnapshot,
    calbackFn,
    oldSub,
    allItemSubscribed
  ) {
    let res = null;
    if (oldSub != null) this.unSubscription(oldSub);

    schema =
      schema != null && schema != ""
        ? schema
        : [
            "refresh",
            "conditionalalert0",
            "logout",
            "getorders",
            "gettodayorders",
            "getbothorders",
            "onlygetbothorders",
            "getremain",
            "FPCheck",
            "text0",
          ];
    mode = mode != null && mode != "" ? mode : "RAW";

    res = this.subscriptionToLS(
      mode,
      items,
      schema,
      "TadbirLightPrivateGatewayAdapter",
      isSnapshot,
      calbackFn,
      oldSub
    );

    if (allItemSubscribed && allItemSubscribed === true) {
      const allitem = [`${this.brokerID}_lightrlc`];
      var subMode = "RAW";
      schema =
        schema != null && schema != ""
          ? schema
          : ["refresh", "conditionalalert0", "logout", "FPCheck", "text0"];

      res = this.subscriptionToLS(
        subMode,
        allitem,
        schema,
        "TadbirLightPrivateGatewayAdapter",
        "no",
        calbackFn,
        oldSub
      );
    }

    return res;
  }

  subscribeClock(callback) {
    var clockgroup = ["getClock".toLowerCase()];
    var issnapshot = "no";
    var mode = "MERGE";
    var dataAdapter = "clock";
    var userschema = ["Key", "Type", "Value"];

    this.subClock = this.subscriptionToLS(
      mode,
      clockgroup,
      userschema,
      dataAdapter,
      issnapshot,
      (updateInfo) => {
        // console.log("updateInfo", updateInfo);
        try {
          updateInfo.forEachChangedField((name, pos, val) => {
            if (val && name === "Value") {
              const val = updateInfo.getValue(3);
              const serverTime = val.split(":");

              const hh = serverTime[0];
              const mm = serverTime[1];
              const ss = serverTime[2];

              const newDate = new Date();
              newDate.setHours(hh);
              newDate.setMinutes(mm);
              newDate.setSeconds(ss);

              callback({ success: true, data: newDate });
            }
          });
        } catch (e) {
          callback({ success: false, error: e });
        }
      },
      this.subClock
    );
  }

  unSubscriptionClock() {
    return this.unSubscription(this.subClock);
  }

  /**
   * [{
   *    orderid
   *    HostOrderId
   *    nsccode
   *    ordersideid
   *    OrderEntryDate
   * }]
   */
  subscribeOrderPlace(obj, callback) {
    let mapOrders = {};

    if (obj == null) return callback({ success: false });

    for (var j = 0; j < obj.length; j++) {
      mapOrders[obj[j].orderid] = obj[j];
    }

    let sub = { items: [] };

    for (var i in obj) {
      if (obj[i].HostOrderId > 0) {
        var key = (
          obj[i].nsccode +
          "_" +
          obj[i].ordersideid +
          "_" +
          this.pad(obj[i].HostOrderId, 6) +
          "_" +
          obj[i].OrderEntryDate +
          "_OrderPlace"
        ).toLowerCase();
        sub[key] = obj[i];
        sub.items.push(key);
      }
      obj[i].orderplace = 0;
    }

    if (sub.items.length > 0) {
      this.subOrderPlace = this.subscriptionToLS(
        "MERGE",
        sub.items,
        ["OrderPlace"],
        "TadbirLightRLC",
        "yes",
        (updateInfo) => {
          let key;
          if (updateInfo.getItemName) key = updateInfo.getItemName();
          if (key) {
            updateInfo.forEachChangedField(async function (name, pos, val) {
              if (val && sub[key]) {
                const orderRow = +val > 0 ? +val : null;
                callback({ success: true, data: orderRow });
              }
            });
          }
        },
        this.subOrderPlace
      );
    }
  }

  unSubscribeOrderPlace() {
    return this.unSubscription(this.subOrderPlace);
  }

  scribeStockState(isin, callback) {
    const isinList = [(isin + "_lightrlc").toLowerCase()];
    const userschema = ["SymbolStateId"];

    this.stockState = this.simpleSubscribe(
      isinList,
      userschema,
      (updateInfo) => {
        try {
          updateInfo.forEachChangedField((name, pos, val) => {
            if (val) {
              console.log("val", val);

              if (name === "SymbolStateId") {
                const symbolStateId = parseInt(val, 10);
                callback({
                  success: true,
                  data: config.statusTadbirToTset[symbolStateId] || {
                    code: null,
                    title: null,
                  },
                });

                translate(
                  "SymbolState_" + SELF_Details.stockInfo.SymbolStateId
                );
              }
            }
          });
        } catch (e) {
          console.error(e);
          console.error(updateInfo);
          callback({ success: false, error: e });
        }
      },
      this.stockState
    );
  }

  unScribeStockState() {
    return this.unSubscription(this.stockState);
  }

  pad(str, max) {
    str = str.toString();
    return str.length < max ? this.pad("0" + str, max) : str;
  }
}

module.exports = TadbirSocket;
