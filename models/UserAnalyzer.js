const nohm = require("nohm").Nohm;

module.exports = nohm.model("UserAnalyzer", {
  idGenerator: "increment",
  properties: {
    analyzerId: {
      type: "integer",
      index: true,
      validations: ["notEmpty"],
    },
    telegramId: {
      type: "integer",
      index: true,
      validations: ["notEmpty"],
    },
  },
});
