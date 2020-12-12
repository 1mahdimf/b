var request = require("request");

var headers = {
  Accept: "application/json, text/plain, */*",
  Referer: "https://d.easytrader.emofid.com/",
  Origin: "https://d.easytrader.emofid.com",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
  Authorization:
    "Bearer eyJhbGciOiJSUzI1NiIsImtpZCI6ImM1ZWQ5OTE4NTJhNGQ4MTIzNWMyMjU0YjQwODA0ZDlmIiwidHlwIjoiSldUIn0.eyJuYmYiOjE1ODY3MzY3MTEsImV4cCI6MTU4Njc1ODMxMSwiaXNzIjoiaHR0cHM6Ly9hY2NvdW50LmVtb2ZpZC5jb20iLCJhdWQiOlsiaHR0cHM6Ly9hY2NvdW50LmVtb2ZpZC5jb20vcmVzb3VyY2VzIiwiZWFzeTJfYXBpIl0sImNsaWVudF9pZCI6ImVhc3kyX2NsaWVudCIsInN1YiI6IjJkNDU4ZWJjLTYzNDQtNGEzZS1iMjhiLTI2ODQyODAyMWE4NSIsImF1dGhfdGltZSI6MTU4NjczNjcxMCwiaWRwIjoibG9jYWwiLCJwayI6IjJkNDU4ZWJjLTYzNDQtNGEzZS1iMjhiLTI2ODQyODAyMWE4NSIsInR3b19mYWN0b3JfZW5hYmxlZCI6ImZhbHNlIiwicHJlZmVycmVkX3VzZXJuYW1lIjoiMmQ0NThlYmMtNjM0NC00YTNlLWIyOGItMjY4NDI4MDIxYTg1IiwibmFtZSI6IjJkNDU4ZWJjLTYzNDQtNGEzZS1iMjhiLTI2ODQyODAyMWE4NSIsImVtYWlsIjoiMjAwN21qbUBnbWFpbC5jb20iLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwicGhvbmVfbnVtYmVyIjoiMDkxNjMwNzMwMjEiLCJwaG9uZV9udW1iZXJfdmVyaWZpZWQiOnRydWUsIm5hdGlvbmFsX2lkIjoiMTg3MDI0NTAwOCIsIm5hdGlvbmFsX2lkX3ZlcmlmaWVkIjoidHJ1ZSIsImN1c3RvbWVyX2lzaW4iOiIxMTI5MTg3MDI0NTAwOCIsInNjb3BlIjpbIm9wZW5pZCIsImVhc3kyX2FwaSJdLCJhbXIiOlsicHdkIl19.biZV_dv5_OZZO7GxR5X68U14AlGYLC5cYqNzpmEiT7N22stk-uk0wGjT8P9t7klF1jVIIIK7WenuoQQBe0iO0eLOs_c-FREXwn92F6MuTqVA0_vOD9c_DW2PHWXIw6hcWq61ryWfX3PuMv2L4sm826J7LeZQIPX3PqzlkujTCm8lREPO2jJFxMa4pyl4A-traSoHCquL5H__OMHjF0_CajA4gopsL8pNnAh6nrDCGxAoDnazl1NFSewg11zQTXCi-qbDpfo-Om_e4PkK5ECbkBph4I2wVY9xdiH_hf6JnDWpXDuS6AXLkgjH8JTvc3RyYqTxBpUCXi_lLxiDAFc_0g",
  "Content-Type": "application/json",
};

const referenceKeyGenerator = () => {
  var e = new Date().getTime();
  return (
    "undefined" != typeof performance &&
      "function" == typeof performance.now &&
      (e += performance.now()),
    "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (t) {
      var n = (e + 16 * Math.random()) % 16 | 0;
      return (
        (e = Math.floor(e / 16)), ("x" === t ? n : (3 & n) | 8).toString(16)
      );
    })
  );
};

var dataString = () =>
  `{"isin":"IRO1INFO0001","financeId":1,"quantity":5225,"price":26843,"side":0,"validityType":74,"validityDateJalali":"1399/1/25","easySource":1,"referenceKey":"${referenceKeyGenerator()}"}`;

var options = {
  url: "https://d11.emofid.com/easy/api/OmsOrder",
  method: "POST",
  headers: headers,
  body: dataString(),
};

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body);
  }
}

const delay = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

const main = async () => {
  while (true) {
    request(options, callback);

    await delay(300);
  }
};

main();
