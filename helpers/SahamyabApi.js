var request = require("request");

class SahamyabApi {
  static async search(query) {
    return new Promise((resolve, reject) => {
      const options = {
        url: encodeURI(
          `https://www.sahamyab.com/api/proxy/symbol/searchNamad?v=0.1&id=${query}`
        ),
        headers: {
          Accept: "application/json, text/plain, */*",
          Referer: "https://www.sahamyab.com/stock-watch",
          "User-Agent":
            "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Safari/537.36"
        }
      };

      request(options, (error, response, body) => {
        if (!error && response.statusCode == 200) {
          const data = JSON.parse(body);
          const filterData = data.result.filter(item => item.type === "symbol");

          const mapData = filterData.map(item => ({
            isin: item.id,
            insCode: item.InsCode,
            name: item.name,
            closingPrice: item.closingPrice
          }));

          return resolve(mapData);
        } else {
          return reject(error);
        }
      });
    });
  }
}

module.exports = SahamyabApi;
