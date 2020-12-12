const nohm = require("nohm").Nohm;

module.exports = nohm.model("Analyzers", {
  idGenerator: "increment",
  properties: {
    isin: {
      type: "string",
      index: true,
      validations: ["notEmpty"],
    },
    isinName: {
      type: "string",
    },
    insCode: {
      type: "string",
    },
    codalId: {
      type: "integer",
    },
    lastAlertAt: {
      type: "string",
    },
    lastNazerAt: {
      type: "string",
    },
    lastCodalAt: {
      type: "string",
    },
    lastStatus: {
      type: "string",
    },
    lastQueueType: {
      type: "string", // buy, sell, spilled, gathered, verge_spilled, verge_gathered, verge_buy, verge_sell
    },
  },
});
