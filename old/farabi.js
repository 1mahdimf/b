const request = require("request");
const { toQueryString } = require("./helpers/index");

const headers = {
  Origin: "https://www.farabixo.com",
  "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
  "User-Agent":
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36",
  "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
  Accept: "*/*",
  "X-Requested-With": "XMLHttpRequest",
  Connection: "keep-alive",
  Cookie:
    "SERVER_NAME=s10; FGTServer=8EC1359D572B1451FDA4979C5C80096D18FA884DA7A802F0B40D382B4EABE0EB7026C00B1D98E1; __RequestVerificationToken=tEG41uXmJRUidkFllqGx9hioDr9R5UD1-DBYFFSWszDhT2pEOlYkXZ4hUFMNEsTWK5pRNw2; _ga=GA1.2.1300023069.1584217708; _gid=GA1.2.1374877428.1584217708; ASP.NET_SessionId=4hiqx5m0ksy02kkbmlpnt33i; .ASPXAUTH=AD65C527AB22B62B5DDF006FCDEE1662429756B7A94BF6729EA90C0F33CB059B5493B33AFEF65EF39CB60849F27BD05384FB52551971F8E09C18A7F21950E45F597DE09DD2EF308783DF5B96; REPOCOOKIE=StartDate=3/14/2020 2:50:57 PM&SessionId=38d67f9f-c6a4-4779-879c-123a6502805b; tads=1584218329075_-904; _gat_gtag_UA_108820058_1=1"
};

const dataString = {
  OrderExecutionType: "PopupTrading",
  popupSelectionMethod: 1,
  id: "",
  ParentId: "",
  ClientInternalId: "winGuid-1640",
  InstrumentIdentification: "IRO1KOSR0001",
  OrderSide: 1,
  InvestorBourseCodeId: 0,
  Quantity: 300,
  Price: 13776,
  DisclosedQuantity: "",
  AccountRouteType: 1,
  ValidityType: 1,
  ValidityDate: "2020/03/16",
  Sum: 4152885,
  Inverstore: 143740,
  __RequestVerificationToken:
    "WU0OxreTlo9krkGaqKAxiMJ3WTHvr95z9bmtUOZVwi3sjFHW-lXd2LjBe6Ra91aRUtKXXvysEpaTGZhD0"
};

const options = {
  url: "https://www.farabixo.com/Tse/Order/AddOnlineOrder",
  method: "POST",
  headers: headers,
  body: toQueryString(dataString)
};

function callback(error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body);
  }
}

request(options, callback);
