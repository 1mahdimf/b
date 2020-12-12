const { exec } = require("child_process");

const isinList = [
  "IRO1GARN0001",
  "IRO1TMLT0001",
  "IRO3SDFZ0001",
  "IRO3TPEZ0001",
  "IRO3SACZ0001",
  "IRO1KOSR0001"
];

let data = [];
isinList.forEach(isin => {
  exec(
    `node ${__dirname}/setPriceArgv.js --isin ${isin}`,
    (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: isin ${isin} - ${error}`);
        return;
      }
      data.push(stdout);
      console.log(`stdout: isin ${isin} - ${stdout}`);
    }
  );
});

setTimeout(() => {
  console.log("outer", data);
}, 5000);
