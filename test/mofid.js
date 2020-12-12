var request = require("request");

var headers = {
  cookie:
    "_ga=GA1.2.154078252.1586018033; ASP.NET_SessionId=vh52cthkkihrq33qrvlo3qta; _gid=GA1.2.673508025.1586689536; crisp-client%2Fsession%2Fe95056ad-2681-452d-976d-0c2a304165c9=session_164b7d9c-9ab6-41b7-bdd0-ae0a3f6a2108; Token=1641d562-5ed8-4b87-9a34-9020c414b653; .ASPXAUTH=E9E8C33D8DB110C21B76AFBDB83A78EB5066D0B50BE1B0814577288FA09B6AD48F5B2ACF1AFB43B0CAEC676051A5B820E98636215E9567593A699A9C65716A5A5BC1E723130B7BCF398ED9C887EB4D5B6E51062BDD9EF805E52BE9128E97DB70279A8E21A249ADA6DB911EC6C90619DB9CBCCC9A22BC122F2DF16885749E256D3D4C9882FF0DF500901F5BB2368BB290E43D1B1F; LS6_https_1603_https%3A%2F%2Fpushv7.etadbir.com%2F=|940_TadbirConnection|; LS6_https_1603_TadbirConnection=|940|; LS6_https_1603_940_TadbirConnection=1586736799344|C|LS6__mofidonline_com_940_TadbirConnection|mofidonline.com",
  origin: "https://mofidonline.com",
  "accept-language": "en-US,en;q=0.9,fa;q=0.8",
  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
  "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
  accept: "*/*",
  referer:
    "https://mofidonline.com/Customer/AddOrder?Lan=fa&cr=f6ba584fe11047b984a70f47cbab9a85",
  authority: "mofidonline.com",
  "x-requested-with": "XMLHttpRequest",
};

var dataString =
  '{"Mode":"buysell","SymbolId":"2045","OrderPrice":"26843","OrderType":"76","OrderSide":"65","OrderValidity":"74","OrderValiditydate":"","OrderTotalQuantity":"5225","TriggerPrice":"","MinimumQuantity":"","MaxShown":"","BourseCode":"","isin":"","pk":"TBRFinancialDataProvider","OrderMode":"add","orderid":"0","OrderExpectedQuantity":"0","ts":null,"cs":"","ss":"null","SymbolNsc":"IRO1INFO0001","SendSMS":false,"browserTime":"08:30:00","IsSymbolInAgreement":"false","AcceptedAgreement":false}';

var options = {
  url:
    "https://mofidonline.com/9/0/SiteCustomerHandler.ashx?lan=fa&.rand=bfcf5ff538444d3a9ba29296c75599db",
  method: "POST",
  headers: headers,
  body: dataString,
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

    await delay(100);
  }
};

main();
