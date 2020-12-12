const nohm = require("nohm").Nohm;

module.exports = nohm.model("User", {
  idGenerator: "increment",
  properties: {
    key: {
      type: "string",
      index: true,
      validations: ["notEmpty"],
    },
    name: {
      type: "string",
      validations: ["notEmpty"],
    },
    software: {
      type: "string", // easytrader, onlineplus, agah, exir
      validations: ["notEmpty"],
    },
    broker: {
      type: "string", // mofid, agah, rahbord, mobin
      validations: ["notEmpty"],
    },
    username: {
      type: "string",
    },
    password: {
      type: "string",
    },
    inactive: {
      type: "integer",
    },
    token: {
      type: "json",
    },
    tokenUpdatedAt: {
      type: "string",
    },
    createdAt: {
      type: "string",
      validations: ["notEmpty"],
    },
  },
});
