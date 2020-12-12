const request = require("request");

const config = require("../config/index");
const server = require("../config/server");

const byTunel = false;

let myApiUrl = config.myApiUrl;
if (byTunel) {
  myApiUrl = `http://185.173.104.135/proxy.php?url=${myApiUrl}`;
}

class MyApi {
  static getHeader() {
    return {
      Authorization: config.myApiToken,
      "content-type": "application/json; charset=UTF-8",
      accept: "application/json, text/plain, */*",
      "cache-control": "no-cache",
    };
  }

  static getOrderById(id) {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${myApiUrl}/order?id=${id}`,
        method: "GET",
        headers: this.getHeader(),
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body);
          resolve(data);
        } else {
          reject({
            url: options.url,
            error,
            statusCode: res ? res.statusCode : 0,
            body,
          });
        }
      });
    });
  }

  static getNewOrderListByServer() {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${myApiUrl}/orders?status=new&server=${server.id}`,
        method: "GET",
        headers: this.getHeader(),
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const data = JSON.parse(body);
          resolve(data);
        } else {
          reject({
            url: options.url,
            error,
            statusCode: res ? res.statusCode : 0,
            body,
          });
        }
      });
    });
  }

  static updateById(id, data) {
    return new Promise((resolve, reject) => {
      const options = {
        url: `${myApiUrl}/order`,
        method: "POST",
        headers: this.getHeader(),
        body: JSON.stringify({
          ...data,
          id,
        }),
        timeout: 10000, // ms
      };

      request(options, (error, res, body) => {
        if (!error && res.statusCode == 200) {
          const result = JSON.parse(body);
          resolve(result);
        } else {
          reject({
            url: options.url,
            error,
            statusCode: res ? res.statusCode : 0,
            body,
          });
        }
      });
    });
  }

  static updateByIdForce(id, data, retryCount = 5) {
    return new Promise(async (resolve, reject) => {
      for (let i = 1; i <= retryCount; i++) {
        try {
          const result = await this.updateById(id, data);
          return resolve(result);
        } catch (e) {
          if (i === retryCount) {
            return reject(e);
          }
          continue;
        }
      }
    });
  }
}

module.exports = MyApi;
