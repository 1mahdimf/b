var request = require("request");

var headers = {
  cookie:
    "GuidedTourVersion=1; SiteVersion=3.7.4; _ga=GA1.2.154078252.1586018033; ASP.NET_SessionId=2zgntigokrabiwubtdnu1vdm; silverse=3wv2eyhnqnj0evs4du32qorb; lastmessage-4=1; _gid=GA1.2.673508025.1586689536; crisp-client%2Fsession%2Fe95056ad-2681-452d-976d-0c2a304165c9=session_164b7d9c-9ab6-41b7-bdd0-ae0a3f6a2108; .ASPXAUTH=E01704349336B8102B18CCA6B8F1BF18825E894CB593943F371541A5D90A173821E171E1EF8E3380CF9578319E51625A938B7EAC981A4CAB63AFD0C10CBF186979F0C1CB820A1FDF22B14F7A1256BD0CE1D2DBCDE3AB8EB98BABD6C8ADA4C62EF7C945F2FC8F801C682B8350BD6B069117FB29F2A3C7BB6A4DB0F2DEF77C98B2; Token=3c268b47-3bcb-4e0c-8f9e-b0266f7bd22d",
  origin: "https://onlineplus.mofidonline.com",
  "accept-encoding": "gzip, deflate, br",
  "accept-language": "en-US,en;q=0.9,fa;q=0.8",
  "user-agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
  "content-type": "application/json",
  accept: "*/*",
  referer: "https://onlineplus.mofidonline.com/Home/Default/page-1",
  authority: "onlineplus.mofidonline.com",
  "x-requested-with": "XMLHttpRequest",
};

var dataString =
  '{"IsSymbolCautionAgreement":false,"CautionAgreementSelected":false,"IsSymbolSepahAgreement":false,"SepahAgreementSelected":false,"orderCount":2493,"orderPrice":12149,"FinancialProviderId":1,"minimumQuantity":"","maxShow":0,"orderId":0,"isin":"IRO1OFRS0001","orderSide":65,"orderValidity":74,"orderValiditydate":null,"shortSellIsEnabled":false,"shortSellIncentivePercent":0}';

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

const delay = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

const main = async () => {
  while (true) {
    request(options, callback);

    await delay(30);
  }
};

main();
