const nohm = require("nohm").Nohm;

module.exports = nohm.model("Nazer", {
  idGenerator: "increment",
  properties: {
    lastAt: {
      type: "string",
    },
  },
});
