const { exec } = require("child_process");
const moment = require("jalali-moment");

const MyApi = require("./helpers/MyApi");
const { delay, timeMoment } = require("./helpers");

const main = async () => {
  const startTimeMoment = timeMoment("07:00:00");
  const endTimeMoment = timeMoment("12:30:00");

  while (true) {
    if (moment().isBetween(startTimeMoment, endTimeMoment)) {
      // get orders
      MyApi.getNewOrderListByServer()
        .then(list => {
          list.forEach(order => {
            console.log("order", order);

            // check time
            const afterTime = timeMoment(order.startTime).subtract(10, "m");
            if (!moment().isAfter(afterTime)) return;

            // check already run
            exec("ps -ax -o cmd | grep order.js", (err, stdout) => {
              const re = new RegExp(`--id ${order.id}$`, "i");
              const foundOrder = stdout.split("\n").find(i => i.match(re));

              if (!foundOrder) {
                MyApi.updateById(order.id, { status: "exec" });

                // run
                exec(
                  `node ${__dirname}/order.js --id ${order.id}`,
                  (err, stdout, stderr) => {
                    if (err) {
                      console.error(`exec error: ${err}`);
                      return;
                    }
                    if (stderr) {
                      console.log(`stderr: ${stderr}`);
                      return;
                    }

                    console.log(`Number of files ${stdout}`);
                  }
                );
              }
            });
          });
        })
        .catch(e => {
          console.log(e);
        });
    } else {
      console.log("out");
    }

    await delay(60000); // 1 min
  }
};

main();
