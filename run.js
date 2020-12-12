const { exec } = require("child_process");
const express = require("express");
const bodyParser = require("body-parser");

const app = express();
app.use(bodyParser.json());

app.listen(4000, () => {
  console.log(`listening on 4000`);
});

app.get("/run", async (req, res) => {
  try {
    const id = parseInt(req.query.id, 10);

    // check already run
    exec("ps -ax -o cmd | grep order.js", (err, stdout) => {
      const re = new RegExp(`--id ${id}$`, "i");
      const foundOrder = stdout.split("\n").find((i) => i.match(re));

      if (!foundOrder) {
        // run order.js
        exec(
          `node ${__dirname}/order.js --id ${id}`,
          (err, stdout, stderr) => {
            if (err) {
              res.status(500).send(`exec error: ${err}`);
              return;
            }
            if (stderr) {
              res.status(500).send(`stderr: ${stderr}`);
              return;
            }

            res.status(200).send(`Number of files ${stdout}`);
          }
        );
      } else {
        res.status(500).send('already run');
      }
    });
  } catch (e) {
    res.status(500).send(e.message);
  }
});
