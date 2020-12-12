const { delay } = require("../helpers");
var request = require("request");

var headers = {
  authority: "onlineplus.mofidonline.com",
  "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
  "x-requested-with": "XMLHttpRequest",
  "content-type": "application/json",
  accept: "*/*",
  origin: "https://onlineplus.mofidonline.com",
  "sec-fetch-site": "same-origin",
  "sec-fetch-mode": "cors",
  "sec-fetch-dest": "empty",
  referer: "https://onlineplus.mofidonline.com/",
  "accept-language": "en-US,en;q=0.9,fa;q=0.8",
  cookie: "GuidedTourVersion=1; _ga=GA1.2.568017125.1589591151; _gid=GA1.2.310693352.1589591151; SiteVersion=3.7.4; lastmessage-4=1; silverse=buo2w4jc02cgh2ocrgvrnonh; crisp-client%2Fsession%2Fe95056ad-2681-452d-976d-0c2a304165c9=session_14294f71-f8d8-4d4f-8dca-9a9db85e3aef; crisp-client%2Fsocket%2Fe95056ad-2681-452d-976d-0c2a304165c9=1; text0_-990470977=true; text0_174039396=true; text0_-1500031073=true; text0_259538783=true; text0_-1820127742=true; .ASPXAUTH=4A7D75459F4C8C6BEFFDBAF699F75AA7705EEB58F228E645E4B4EC8DFE568DCBB64BB47CC49D5E3732F0D7FB4EC4A8EC26248FC261E2EB50FF773D086B203D796DD41A56954582D36F137652AF3547A2402BC95F47D5BA678085B31318C0E11B159C6BC8156DD0C31A31BF2C4D77DF8FBC7E5621E9BB2AD15B68B89E474103EA; Token=416cf137-8bf1-4224-aa80-af1c23f2e790; text0_1165334655=true; lastmessage-6=56240; lastmessage-2=1; text0_1841318681=true; text0_1138652570=true; text0_-357527538=true",
};

const main = async () => {
  for (let i = 1; i <= 100; i++) {
    // for (let j = 0; j < 4; j++) {
    const j = 0;
    var dataString = `{"IsSymbolCautionAgreement":false,"CautionAgreementSelected":false,"IsSymbolSepahAgreement":false,"SepahAgreementSelected":false,"orderCount":10,"orderPrice":${7255 + j},"FinancialProviderId":1,"minimumQuantity":"","maxShow":0,"orderId":0,"isin":"IRO1SKBV0001","orderSide":"86","orderValidity":74,"orderValiditydate":null,"shortSellIsEnabled":false,"shortSellIncentivePercent":0}`;

    var options = {
      url: "https://onlineplus.mofidonline.com/Customer/SendOrder",
      method: "POST",
      headers: headers,
      body: dataString,
    };

    function callback(error, response, body) {
      if (!error && response.statusCode == 200) {
        console.log(body);
      }
    }

    request(options, callback);
    await delay(1000);
    // }
  }
};

main();
