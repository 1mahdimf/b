const FarabixoApi = require("../helpers/FarabixoApi");

const main = async () => {
  try {
    const farabixoApi = new FarabixoApi();
    const result = await farabixoApi.login("***", "***");
    console.log(result);
  } catch (e) {
    console.log(e);
  }
};
main();
