/**
 * node queue.js --date 2020-05-17
 */
const moment = require("jalali-moment");
const argv = require("minimist")(process.argv.slice(2));

const TsetmcApi = require("../helpers/TsetmcApi");
const TadbirApi = require("../helpers/TadbirApi");
const { delay } = require("../helpers");

const db = require("./db");

const main = async () => {
  // let result = [];
  let faildList = [];

  const date = argv.date || "2020-05-17";
  const isToday = true;
  const byCDN3 = true;

  try {
    let list = await TadbirApi.getSybmolDetailsList();
    // let list = await TadbirApi.search("وآوا", true);
    list = list.map(item => ({ ...item, retry: 0 }));
    // list = [list.find((i) => i.name === "لوتوس")];

    let count = 0;
    const len = list.length;
    while (list.length > 0) {
      count++;
      console.log("remain count", len - count);
      console.log("-------------------------");

      let item = list[0];
      list.splice(0, 1);

      if (item === null) {
        console.log("error 1");
        continue;
      }
      console.log(item.name, item.groupId, item.insCode);

      if (selectGroupList.indexOf(item.groupId) === -1) {
        console.log("error 2");
        continue;
      }
      if (item.name.match(/\d+/)) {
        console.log("error 3");
        continue;
      }
      if (item.name.slice(-1) === "ح") {
        console.log("error 4");
        continue;
      }

      const findInDb = await selectAnalyzerByInsCodeAndDate(item.insCode, date);
      if (findInDb) continue;

      await delay(1);

      const details = await TsetmcApi.getDetailsByDate(
        item.insCode,
        date,
        byCDN3,
        null,
        isToday
      );

      if (details === false) {
        console.log("details is FALSE");
        continue;
      }

      if (details === null) {
        console.log("details is NULL");
        if (item.retry < 2) {
          list.push({ ...item, retry: item.retry + 1 });
        } else {
          faildList.push(item);
        }
        continue;
      }

      let intraTrade = details.intraTrade;
      let tradeDetails = details.tradeDetails;

      const percentRange = Math.floor(
        (details.baseDetails.highPrice / details.baseDetails.lowPrice - 1) * 100
      );
      if (percentRange < 7) {
        console.log("error percent range", percentRange);
        continue;
      }

      if (!tradeDetails) {
        console.log("error trade details", tradeDetails);
        continue;
      }
      if (!details.instrumentList) {
        console.log("error instrument list", details.instrumentList);
        continue;
      }

      if (
        tradeDetails.noBuyReal + tradeDetails.noBuyLegal === 0 ||
        Number.isNaN(tradeDetails.noBuyReal)
      ) {
        if (isToday) {
          const instInfoFast = await TsetmcApi.getDetailsSymbolRepeter(
            item.insCode
          );
          tradeDetails = instInfoFast ? instInfoFast.tradeDetails : null;
        }

        if (
          tradeDetails && tradeDetails.noBuyReal + tradeDetails.noBuyLegal === 0
        ) {
          console.log("error buy count", tradeDetails);
          continue;
        }
      }

      let info = {
        floating: 0,
        EPS: 0,
        PE: 0,
        groupPE: 0,
      };
      if (isToday) {
        info = await TsetmcApi.getDetailsSymbol(item.insCode);
        if (!info) {
          console.log("faild get symbol data");
          if (item.retry < 2) {
            list.push({ ...item, retry: item.retry + 1 });
          } else {
            faildList.push(item);
          }
          continue;
        }

        // if (!intraTrade || (intraTrade && intraTrade.length === 0)) {
        //   intraTrade = await TsetmcApi.getTradeDetail(item.insCode);
        //   if (!intraTrade) continue;
        // }
      }

      let fallResistancePercent = null;
      if (intraTrade && intraTrade.length > 0) {
        let countFall = 0;

        intraTrade.forEach(d => {
          if (d.price < details.baseDetails.highPrice) {
            countFall += 1;
          }
        });

        fallResistancePercent = 100 - countFall / intraTrade.length * 100;
      } else if (details.queueList && details.queueList.length > 0) {
        let countFall = 0;

        details.queueList.forEach(d => {
          if (d.priceBuy < details.baseDetails.highPrice) {
            countFall += 1;
          }
        });

        fallResistancePercent =
          100 - countFall / details.queueList.length * 100;
      }

      let intResult = {};
      if (intraTrade.length > 0) {
        let listInt = {};
        intraTrade.forEach(int => {
          const key = `${int.time}-${int.price}`;
          const sumVolume = listInt[key] ? listInt[key].sumVolume : 0;
          listInt[key] = { ...int, sumVolume: sumVolume + int.volume };
        });
        intResult = Object.values(listInt).sort(
          (a, b) => b.sumVolume - a.sumVolume
        )[0];
      }

      const statusList = details.instrumentList;

      let status20percent = false;
      if (statusList.length >= 4) {
        if (
          statusList[1].status === "AS" &&
          statusList[2].status === "AR" &&
          statusList[3].status === "A"
        ) {
          status20percent = true;
        }
      }

      let status50percent = false;
      if (statusList.length >= 3) {
        if (statusList[1].status === "I" && statusList[2].status === "IS") {
          status50percent = true;
        }
      }

      if (statusList.length >= 6) {
        if (
          statusList[0].status === "AR" &&
          statusList[1].status === "I" &&
          statusList[2].status === "IS" &&
          statusList[3].status === "IR" &&
          statusList[4].status === "I" &&
          statusList[5].status === "IS"
        ) {
          status20percent = true;
          status50percent = true;
        }
      }

      const values = {
        ...info,
        ...tradeDetails,
        ...details.baseDetails,

        name: item.name,
        groupName: item.group,
        isin: item.isin,
        insCode: item.insCode,
        jDate: moment(date).format("jYYYY-jMM-jDD"),
        date,

        fallResistancePercent,

        maxVolumeOneTime: intResult.sumVolume || null,
        maxVolumePriceOneTime: intResult.price || null,
        maxVolumeTimeOneTime: intResult.time || null,

        status: details.instrumentList
          .map(is => {
            return `${is.date} ${is.time}: ${is.status}`;
          })
          .join(" - "),
        status20percent,
        status50percent,
        statusReopening: false,
      };

      console.log(values);

      // result.push(res);

      const insertId = await insertAnalyzer(values);
      console.log("insert in Analyzer");

      if (details.queueList && details.queueList.length > 0) {
        for (let t = 0; t < details.queueList.length; t++) {
          if (details.queueList[t].row > 0) {
            await insertAnalyzerTable(insertId, details.queueList[t]);
            console.log("insert in Analyzer Table");
          }
        }
      }
    }

    // console.log(excel(date, result));
  } catch (e) {
    // console.log(excel(date, result));
    console.log(e);
  }

  if (faildList.length > 0) {
    console.log("-----------------------");
    console.log(faildList.map(f => `${f.name} - ${f.insCode}`).join("\n"));
  }
};

// const excel = (date, list) => {
//   let workbook = new Excel.Workbook();

//   const worksheet = workbook.addWorksheet(`تحلیلگر بورس - ${date}`);
//   worksheet.views = [{ rightToLeft: true }];
//   worksheet.pageSetup.showGridLines = true;

//   worksheet.addRow([
//     "نماد",

//     "وزن",
//     "درصد مقاومت",
//     "درصد سود/ضرر در بدترین حالت",
//     "درصد پرکردن حجم مبنا",
//     "درصد پرکردن حجم مبنا توسط حقوقی",

//     "تعداد خریدار",
//     "حجم فروش حقوقی",

//     "گروه",
//     "قیمت",

//     "تایم ثانیه اول",
//     "تعداد نفرات اولین خرید",
//     "حجم اولین خرید",

//     "تایم ثانیه دوم",
//     "تعداد نفرات دومین خرید",
//     "حجم دومین خرید",

//     "تایم اواسط بازگشایی",
//     "تعداد نفرات اواسط خرید",
//     "حجم اواسط خرید",
//     "تعداد نفرات اواسط فروش",
//     "حجم اواسط فروش",

//     "تغییر وضعیت",
//   ]);

//   list.forEach((item, i) => {
//     worksheet.addRow(Object.values(item));
//   });

//   worksheet.getRow(1).fill = {
//     type: "pattern",
//     pattern: "solid",
//     fgColor: { argb: "FFBFBFBF" },
//   };

//   // worksheet.getColumn(1).width = 5;

//   const fileName = `${__dirname}/analyzer_queue_${moment(date).format(
//     "jYYYY-jMM-jDD"
//   )}.xlsx`;
//   workbook.xlsx.writeFile(fileName);
// };

const selectGroupList = [
  "10",
  "14",
  "11",
  "13",
  "73",
  "70",
  "22",
  "69",
  "57",
  "66",
  "45",
  "46",
  "50",
  "26",
  "41",
  "02",
  "61",
  "51",
  "60",
  "74",
  "47",
  "34",
  "19",
  "01",
  "32",
  "28",
  "56",
  "53",
  "40",
  "23",
  "77",
  "82",
  "71",
  "63",
  "90",
  "93",
  "67",
  "27",
  "38",
  "25",
  "29",
  "31",
  "36",
  "20",
  "44",
  "42",
  "21",
  "64",
  "17",
  "43",
  "55",
  "49",
  "39",
];

db.connect(err => {
  if (err) throw err;
  console.log("Mysql connected!");
  main();
});

const insertAnalyzer = values => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO analyzer (\
        id, \
        name, \
        groupName, \
        isin, \
        insCode, \
        jDate, \
        date, \
        highPrice, \
        lowPrice, \
        lastTradeDateTime, \
        lastTradePrice, \
        finalPrice, \
        fallResistancePercent, \
        minTradePrice, \
        maxTradePrice, \
        noTrade, \
        volumeTrade, \
        noBuyReal, \
        volumeBuyReal, \
        noSellReal, \
        volumeSellReal, \
        noBuyLegal, \
        volumeBuyLegal, \
        noSellLegal, \
        volumeSellLegal, \
        floating, \
        basisVolume, \
        EPS, \
        PE, \
        groupPE, \
        maxVolumeOneTime, \
        maxVolumePriceOneTime, \
        maxVolumeTimeOneTime, \
        status, \
        status20percent, \
        status50percent, \
        statusReopening)\
        \
      VALUES (\
        NULL, \
        '${values.name}', \
        '${values.groupName}', \
        '${values.isin}', \
        '${values.insCode}', \
        '${values.jDate}', \
        '${values.date}', \
        '${values.highPrice}', \
        '${values.lowPrice}', \
        '${values.lastTradeDateTime}', \
        '${values.lastTradePrice}', \
        '${values.finalPrice}', \
        '${values.fallResistancePercent}', \
        '${values.minTradePrice}', \
        '${values.maxTradePrice}', \
        '${values.noTrade}', \
        '${values.volumeTrade}', \
        '${values.noBuyReal}', \
        '${values.volumeBuyReal}', \
        '${values.noSellReal}', \
        '${values.volumeSellReal}', \
        '${values.noBuyLegal}', \
        '${values.volumeBuyLegal}', \
        '${values.noSellLegal}', \
        '${values.volumeSellLegal}', \
        '${values.floating}', \
        '${values.basisVolume}', \
        '${values.EPS}', \
        '${values.PE}', \
        '${values.groupPE}', \
        '${values.maxVolumeOneTime}', \
        '${values.maxVolumePriceOneTime}', \
        '${values.maxVolumeTimeOneTime}', \
        '${values.status}', \
        '${values.status20percent ? 1 : 0}', \
        '${values.status50percent ? 1 : 0}', \
        '${values.statusReopening ? 1 : 0}' \
      );`,
      (err, sqlResult) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(sqlResult.insertId);
      }
    );
  });
};

const insertAnalyzerTable = (parentId, values) => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO analyzer_table (\
        id, \
        analyzerId, \
        row, \
        priceBuy, \
        noBuy, \
        volumeBuy, \
        priceSell, \
        noSell, \
        volumeSell, \
        lastTradePrice, \
        volumeTrade, \
        countTrade, \
        time, \
        text \
      )\
      VALUES (\
        NULL, \
        '${parentId}', \
        '${values.row}', \
        '${values.priceBuy}', \
        '${values.noBuy}', \
        '${values.volumeBuy}', \
        '${values.priceSell}', \
        '${values.noSell}', \
        '${values.volumeSell}', \
        '${values.lastTradePrice || 0}', \
        '${values.volumeTrade || 0}', \
        '${values.countTrade || 0}', \
        '${values.time}', \
        '${values.text || ""}' \
      );`,
      (err, sqlResult) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        return resolve(sqlResult.insertId);
      }
    );
  });
};

const selectAnalyzerByInsCodeAndDate = (insCode, date) => {
  return new Promise(resolve => {
    db.query(
      `SELECT id FROM analyzer WHERE insCode = '${insCode}' AND date = '${date}';`,
      (err, sqlResult) => {
        if (err || (sqlResult && sqlResult.length === 0)) {
          console.log(err);
          return resolve(null);
        }
        return resolve(sqlResult[0]);
      }
    );
  });
};
