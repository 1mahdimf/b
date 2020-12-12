const request = require("request");

const options = {
  url: `http://185.173.104.135/proxy.php`,
  method: "PUT",
  headers: {
    Authorization: "123",
    "content-type": "application/json; charset=UTF-8",
    accept: "application/json, text/plain, */*",
    "cache-control": "no-cache",
  },
  body: JSON.stringify({
    id: 1,
  }),
  timeout: 10000, // ms
};

request(options, (error, res, body) => {
  if (!error && res.statusCode == 200) {
    console.log(body);
    const result = JSON.parse(body);
    console.log(result);
  } else {
    console.log(error, res.statusCode);
  }
});
