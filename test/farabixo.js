const moment = require("jalali-moment");
const request = require("request");

const { delay, timeMoment } = require("../helpers/index");

const main = async () => {
  const headers = {
    Connection: "keep-alive",
    "User-Agent":
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Accept: "*/*",
    Origin: "https://www.farabixo.com",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    "Accept-Language": "en-US,en;q=0.9,fa;q=0.8",
    Cookie:
      "_ga=GA1.2.1300023069.1584217708; SERVER_NAME=s1; __RequestVerificationToken=lm4RxsJTc_LA2Pq5LFDMPzjquf6UzTLpnCwxNXcx_RFVHF_reiTpV5f-VTynTSxTkEqlSQ2; _gid=GA1.2.894288482.1592115992; ASP.NET_SessionId=j4g1m2kocsklcd4gfpponga3; .ASPXAUTH=8F34FCBBF4A7647A9D76C5054581AECD9ACB08962784FA8505CF40F304B440771CEA277B394928A3E2BAE73D619018FED170646F18112BEF004D7AB771ADC13D255B09FAFE4F8FCD63F6B311D9380CC01571A9F8; REPOCOOKIE=StartDate=6/14/2020 7:38:59 AM&SessionId=8670b113-8e84-4571-95b2-14fcefda1838; tads=1592116845958_-2323; _gat_gtag_UA_108820058_1=1",
  };

  const dataString =
    "OrderExecutionType=PopupTrading&popupSelectionMethod=1&id=&ParentId=&ClientInternalId=winGuid-1681&InstrumentIdentification=IRO3APOZ0001&OrderSide=1&InvestorBourseCodeId=0&Quantity=2209&Price=90104&AccountRouteType=1&ValidityType=1&ValidityDate=2020%2F06%2F15&Sum=199983184&Inverstore=329518&__RequestVerificationToken=Qh2dPeRBWWGuyyVmccMmfkmkdOuXSWq9Rst5pDCKUTwnVq9sMLxCQSDhsXCM6AqpL5AinTMGLeyA6K2RbRoyJRhGY301";

  const options = {
    url: "https://www.farabixo.com/Tse/Order/AddOnlineOrder",
    method: "POST",
    headers: headers,
    body: dataString,
  };

  const startTimeMoment = timeMoment("12:34:45");
  const endTimeMoment = timeMoment("12:35:05");

  let num = 1;
  while (true) {
    if (moment().isBetween(startTimeMoment, endTimeMoment)) {
      console.log(`SEND ${num}`);

      request(options, (error, response, body) => {
        console.log(`RECEIVE ${num}`);

        if (!error && response.statusCode == 200 && body) {
          console.log("OK", body);
        } else {
          console.log("ERROR", response ? response.statusCode : 0);
        }
      });
    } else {
      console.log("OUT OF TIME", moment().format("HH:mm:ss SSS"));
    }

    await delay(50);
  }
};

main();
