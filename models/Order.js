const nohm = require("nohm").Nohm;

module.exports = nohm.model("Order", {
  idGenerator: "increment",
  properties: {
    userId: {
      type: "integer",
      index: true,
      validations: ["notEmpty"]
    },
    isin: {
      type: "string",
      validations: ["notEmpty"]
    },
    isinName: {
      type: "string"
    },
    side: {
      type: "string",
      defaultValue: "buy", // buy, sell
      validations: ["notEmpty"]
    },
    price: {
      type: "integer"
    },
    quantity: {
      type: "integer"
    },
    startTime: {
      type: "string",
      validations: ["notEmpty"]
    },
    endTime: {
      type: "string",
      validations: ["notEmpty"]
    },
    delay: {
      type: "integer", // [x] ms
      validations: ["notEmpty"]
    },
    status: {
      type: "string",
      index: true,
      defaultValue: "new", // new, run, done, cancel, failed
      validations: ["notEmpty"]
    },
    statusText: {
      type: "string"
    },
    server: {
      type: "string",
      index: true,
      defaultValue: "iran_79.175.176.237", // iran_79.175.176.237, german_46.4.144.70
      validations: ["notEmpty"]
    },
    position: {
      type: "integer"
    },
    volumetricPosition: {
      type: "integer"
    },
    positionCreatedAt: {
      type: "string"
    },
    createdAt: {
      type: "string",
      validations: ["notEmpty"]
    },
    updatedAt: {
      type: "string"
    }
  }
});
