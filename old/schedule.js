const schedule = require("node-schedule");

schedule.scheduleJob("0 9 2 * * *", () => {
  console.log("The answer to life, the universe, and everything!");
});
