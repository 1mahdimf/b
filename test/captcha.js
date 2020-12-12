const im = require("imagemagick");
const tesseract = require("node-tesseract-ocr");
const fs = require("fs");
const request = require("request");

const orginal = `${__dirname}/captcha.jpeg`;
const converted = `${__dirname}/captcha-converted.jpeg`;

const captchaUrl = `https://onlineplus.mofidonline.com/${Math.floor(Math.random() * 10000000 + 1)}/Account/Captcha?postfix=${Math.floor(Math.random() * 10000000 + 1)}`;
const loginUrl = "https://onlineplus.mofidonline.com/login";

const main = async () => {
  try {
    const cookie = await getCookies(loginUrl);
    console.log("cookie", cookie);

    let code = null;
    for (let i = 0; i < 5; i++) {
      await download(captchaUrl, cookie, `${__dirname}/captcha.jpeg`);

      await imgMagick(orginal, converted);

      code = await tesseractOcr(converted);
      code = code.trim();
      console.log("code", code);
      if (code.length === 4) break;
    }

    if (code) {
      const result = await login("***", "***", code, cookie);
      console.log(result);

      request(
        {
          url: "https://onlineplus.mofidonline.com/Handlers/GetAccountRemain.ashx",
          headers: {
            authority: "onlineplus.mofidonline.com",
            "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
            "x-requested-with": "XMLHttpRequest",
            accept: "*/*",
            "sec-fetch-site": "same-origin",
            "sec-fetch-mode": "cors",
            "sec-fetch-dest": "empty",
            referer: "https://onlineplus.mofidonline.com/Home/Default/page-1",
            "accept-language": "en-US,en;q=0.9,fa;q=0.8",
            cookie: result.join(";"),
          },
        },
        (error, response, body) => {
          if (!error && response.statusCode == 200) {
            console.log(body);
          }
        }
      );

      // fs.writeFile(`${__dirname}/login.html`, result, function(err) {
      //   if (err) return console.log(err);

      //   console.log(`${__dirname}/login.html`);
      // });
    }
  } catch (e) {
    console.log("error", e);
  }
};

const imgMagick = (orginal, converted) => {
  return new Promise((resolve, reject) => {
    im.convert(
      [
        orginal,
        "-fuzz",
        "5%",
        "-fill",
        "#FFFFFF",
        "-opaque",
        "#000000",
        "-opaque",
        "#101010",
        "-opaque",
        "#242424",
        "-opaque",
        "#3b3b3b",
        "-opaque",
        "#b9b9b9",
        "-opaque",
        "#ababab",
        "-opaque",
        "#505050",
        "-opaque",
        "#f4f4f4",
        "-opaque",
        "#949494",
        "-opaque",
        "#787878",
        "-threshold",
        "60%",
        "-blur",
        1,
        "-sharpen",
        1,
        "-blur",
        1,
        "-sharpen",
        1,
        "-blur",
        1,
        "-sharpen",
        1,
        "-blur",
        1,
        "-sharpen",
        1,
        converted,
      ],
      (err, stdout) => {
        if (err) reject(err);
        resolve(stdout);
      }
    );
  });
};

const tesseractOcr = converted => {
  return new Promise((resolve, reject) => {
    const config = {
      lang: "eng",
      tessedit_char_whitelist: "0123456789",
      psm: 7,
      oem: 3,
      dpi: 70,
    };

    tesseract.recognize(converted, config).then(resolve, reject);
  });
};

const download = (url, cookie, filename) => {
  return new Promise((resolve, reject) => {
    request({
      url,
      headers: {
        authority: "onlineplus.mofidonline.com",
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
        accept: "image/webp,image/apng,image/*,*/*;q=0.8",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "no-cors",
        "sec-fetch-dest": "image",
        referer: loginUrl,
        "accept-language": "en-US,en;q=0.9,fa;q=0.8",
        cookie,
      },
    })
      .pipe(fs.createWriteStream(filename))
      .on("close", resolve);
  });
};

const getCookies = url => {
  return new Promise((resolve, reject) => {
    options = {
      url,
      method: "GET",
      timeout: 3000, // ms
      headers: {
        authority: "onlineplus.mofidonline.com",
        accept: "application/json, text/plain, */*",
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        referer: loginUrl,
        "accept-language": "en-US,en;q=0.9,fa;q=0.8",
      },
    };

    request(options, (error, res, body) => {
      if (
        !error &&
        res &&
        res.statusCode == 200 &&
        res.headers &&
        res.headers["set-cookie"] &&
        res.headers["set-cookie"].length > 0
      ) {
        const cookies = res.headers["set-cookie"][0].trim().split(";");
        resolve(cookies[0]);
      } else {
        reject({
          error,
          statusCode: res ? res.statusCode : 0,
          url: options.url,
        });
      }
    });
  });
};

const login = (username, password, capcha, cookie) => {
  return new Promise((resolve, reject) => {
    const body = `username=${username}&password=${password}&capcha=${capcha}`;

    options = {
      url: loginUrl,
      method: "POST",
      body,
      followAllRedirects: false, // important
      headers: {
        authority: "onlineplus.mofidonline.com",
        "cache-control": "max-age=0",
        "upgrade-insecure-requests": "1",
        origin: "https://onlineplus.mofidonline.com",
        "content-type": "application/x-www-form-urlencoded",
        "user-agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36",
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",
        referer: loginUrl,
        "accept-language": "en-US,en;q=0.9,fa;q=0.8",
        cookie,
      },
      timeout: 3000, // ms
    };

    request(options, (error, res, body) => {
      if (!error) {
        if (res.statusCode == 302) {
          return resolve(res.headers["set-cookie"]);
        } else if (
          res.statusCode == 200 &&
          body.indexOf("نام کاربری یا کلمه عبور اشتباه است") !== -1
        ) {
          return reject("pass");
        } else if (
          res.statusCode == 200 &&
          body.indexOf("کد امنیتی وارد شده اشتباه می باشد") !== -1
        ) {
          return reject("captcha");
        }
        reject("unknown");
      } else {
        reject("unknown");
      }
    });
  });
};

main();
