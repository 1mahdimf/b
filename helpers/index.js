require("dotenv").config();

const fs = require("fs");
const moment = require("jalali-moment");
const num2persian = require("./Num2persian");

let im = null;
let tesseract = null;
if (process.env.APP_ENV === "server") {
  im = require("imagemagick");
  tesseract = require("node-tesseract-ocr");
}

exports.getUnique = (arr, key) => {
  const unique = arr
    .map((e) => e[key])
    // store the keys of the unique objects
    .map((e, i, final) => final.indexOf(e) === i && i)
    // eliminate the dead keys & store unique objects
    .filter((e) => arr[e])
    .map((e) => arr[e]);

  return unique;
};

exports.delay = (ms) => {
  return new Promise((res) => setTimeout(res, ms));
};

exports.log = (fileName, text, fractionalSeconds = false) => {
  fs.appendFileSync(
    `./logs/${fileName}.log`,
    `${moment().format(
      `YYYY-MM-DD HH:mm:ss${fractionalSeconds ? " SSS" : ""}`
    )} - ${text}\r\n`
  );
};

exports.referenceKeyGenerator = () => {
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

exports.agahCategoryId = () => {
  const s = () => {
    return (((1 + Math.random()) * 65536) | 0).toString(16).substring(1);
  };
  return (
    s() +
    s() +
    "-" +
    s() +
    "-4" +
    s().substr(0, 3) +
    "-" +
    s() +
    "-" +
    s() +
    s() +
    s()
  ).toLowerCase();
};

exports.timeMoment = (time) => {
  return moment(
    `${moment().format("YYYY-MM-DD")} ${time}`,
    "YYYY-MM-DD HH:mm:ss"
  );
};

exports.calculateQuantityByCredit = (credit, price, exirBroker = false) => {
  const newCredit = credit - Math.ceil(credit * (exirBroker ? 0.006 : 0.00462));
  const quantity = Math.floor(newCredit / price);
  return quantity;
};

exports.calculatePrice = (closingPrice, maxPercentChange, isin) => {
  let priceHigh = Math.floor(closingPrice * (1 + maxPercentChange / 100));
  let priceLow = Math.ceil(closingPrice * (1 - maxPercentChange / 100));

  // OTC: /(IRO3\w+)|(IRR3\w+)|(IRI3\w+)|(IRO5\w+)|(IRR7\w+)/i
  if (/IRO1\w+|IRR1\w+/i.test(isin)) {
    priceHigh = Math.floor(priceHigh / 10) * 10;
    priceLow = Math.ceil(priceLow / 10) * 10;
  }

  return { priceHigh, priceLow };
};

exports.currency = (value, showUnit = true) => {
  if (!value) {
    return showUnit ? "0 ریال" : "0";
  }

  value = value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (showUnit) {
    value += " ریال";
  }
  return value;
};

exports.currencyAlpha = (value, showUnit = true, toToman = true) => {
  if (!value) {
    return showUnit ? (toToman ? "صفر تومان" : "صفر ریال") : "صفر";
  }

  if (toToman) {
    value = Math.round(value / 10);
  }

  value = num2persian(value);

  if (showUnit) {
    value += toToman ? " تومان" : " ریال";
  }
  return value;
};

exports.roundCurrency = (value) => {
  let convert = 1;

  if (value < 1000000) {
    convert = 10000;
  } else if (value < 10000000) {
    convert = 100000;
  } else if (value < 1000000000) {
    convert = 1000000;
  } else if (value < 100000000000) {
    convert = 10000000;
  } else {
    return value;
  }

  return Math.round(value / convert) * convert;
};

exports.digit = (value) => {
  if (!value) {
    return 0;
  }

  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

exports.toQueryString = (obj) => {
  const parts = [];
  for (const i in obj) {
    if (obj.hasOwnProperty(i)) {
      const value = obj[i] ? encodeURIComponent(obj[i]) : "";
      if (value) {
        parts.push(`${i}=${value}`);
      }
    }
  }
  return parts.join("&");
};

exports.removeDuplicates = (arr) => {
  var result = [];
  arr.forEach((item) => {
    if (result.indexOf(item) < 0) {
      result.push(item);
    }
  });
  return result;
};

exports.paginationFilterList = (list, page = 1, limit = 20, sort = "ASC") => {
  if (sort === "DESC") {
    list = list.reverse();
  }

  let newList = [];
  const firstIndex = limit * (page - 1);
  for (let index = limit * (page - 1); index < limit + firstIndex; index++) {
    if (list[index] !== undefined) {
      newList.push(list[index]);
    }
  }

  return newList;
};

exports.paginationInlineKeyboard = (
  count,
  limit = 20,
  perfixCallback = "",
  currentPage = 1
) => {
  const pageCount = Math.ceil(count / limit);

  if (pageCount <= 1) {
    return null;
  }

  let pagination = [];
  for (let page = 1; page <= pageCount; page++) {
    pagination.push({
      text: page.toString(),
      callback_data: perfixCallback + page,
    });
  }

  let finalPagination = [];
  if (pagination.length > 5) {
    finalPagination[0] = pagination[0];
    finalPagination[4] = pagination[pagination.length - 1];

    firstPage = 1;
    endPage = pagination.length;
    lastPage = currentPage - 1;
    nextPage = currentPage + 1;

    if (
      currentPage === firstPage ||
      currentPage === firstPage + 1 ||
      currentPage === firstPage + 2
    ) {
      finalPagination[1] = pagination[firstPage];
      finalPagination[2] = pagination[firstPage + 1];
      finalPagination[3] = pagination[firstPage + 2];
      finalPagination[3].text += " ...";
      finalPagination[currentPage - 1].text = `[ ${
        finalPagination[currentPage - 1].text
      } ]`;
    } else if (
      currentPage === endPage ||
      currentPage === endPage - 1 ||
      currentPage === endPage - 2
    ) {
      finalPagination[1] = pagination[endPage - 4];
      finalPagination[1].text = "... " + finalPagination[1].text;
      finalPagination[2] = pagination[endPage - 3];
      finalPagination[3] = pagination[endPage - 2];
      finalPagination[4 - (endPage - currentPage)].text = `[ ${
        finalPagination[4 - (endPage - currentPage)].text
      } ]`;
    } else {
      finalPagination[1] = pagination[currentPage - 2];
      finalPagination[1].text = "... " + finalPagination[1].text;
      finalPagination[2] = pagination[currentPage - 1];
      finalPagination[2].text = `[ ${finalPagination[2].text} ]`;
      finalPagination[3] = pagination[currentPage];
      finalPagination[3].text += " ...";
    }
  } else {
    finalPagination = pagination;
    finalPagination[currentPage - 1].text = `[ ${
      finalPagination[currentPage - 1].text
    } ]`;
  }

  return [finalPagination];
};

exports.twoDigit = (number) => {
  return ("0" + number).slice(-2);
};

exports.fixTime = (time) => {
  const first = parseInt(time.charAt(0));

  let hour = "00";
  let minute = "00";
  let second = "00";

  if (first >= 8 && first <= 9) {
    hour = this.twoDigit(first);
    minute = time.substring(1, 3);
    second = time.substring(3, 5);
  } else {
    hour = time.substring(0, 2);
    minute = time.substring(2, 4);
    second = time.substring(4, 6);
  }

  return `${hour}:${minute}:${second}`;
};

exports.advRound = (a, b) => {
  return Math.round(b * Math.pow(10, a)) / Math.pow(10, a);
};

exports.isString = (value) => {
  return typeof value === "string" || value instanceof String;
};
exports.isNumber = (value) => {
  return typeof value === "number" && isFinite(value);
};
exports.isArray = (value) => {
  return value && typeof value === "object" && value.constructor === Array;
};
exports.isFunction = (value) => {
  return typeof value === "function";
};
exports.isObject = (value) => {
  return value && typeof value === "object" && value.constructor === Object;
};
exports.isNull = (value) => {
  return value === null;
};
exports.isUndefined = (value) => {
  return typeof value === "undefined";
};
exports.isBoolean = (value) => {
  return typeof value === "boolean";
};

exports.imgMagickOnlineplus = (orginal, converted) => {
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

exports.imgMagickFarabixo = (orginal, converted) => {
  return new Promise((resolve, reject) => {
    im.convert(
      [orginal, "-background", "#000000", "-layers", "flatten", converted],
      (err, stdout) => {
        if (err) reject(err);
        resolve(stdout);
      }
    );
  });
};

exports.tesseractOcr = (converted) => {
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

exports.random = (min, max) => {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
};
