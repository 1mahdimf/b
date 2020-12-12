/**
 * node report.js --date 2020-05-17 --before 5
 */
const argv = require("minimist")(process.argv.slice(2));

const Excel = require("exceljs");
const moment = require("jalali-moment");

const { delay, currency } = require("../helpers");
const TadbirApi = require("../helpers/TadbirApi");
const TsetmcApi = require("../helpers/TsetmcApi");
const config = require("../config");

const db = require("./db");

const main = async () => {
  try {
    let date = null;
    let specificDate = null;
    let beforeDateList = null;

    if (argv.date) {
      date = argv.date;
      specificDate = date;
    } else {
      const lastDate = await getLastDate();
      date = moment(lastDate).format("YYYY-MM-DD");
    }

    if (argv.before) {
      beforeDateList = await getBeforeDays(argv.before, specificDate);
    }

    const list = await getDataGroup(specificDate);
    const status20 = await getStatus2050(20);
    const status50 = await getStatus2050(50);

    let beforeList = null;
    let table = null;
    if (specificDate) {
      beforeList = await getDataGroup(null, specificDate, beforeDateList);
      table = await getTableGroup(null, specificDate, beforeDateList);
    } else {
      table = await getTableGroup(specificDate, beforeDateList);
    }

    let result = [];
    for (let i = 0; i < list.length; i++) {
      const item = list[i];

      const tableQueue = table
        ? table.find((t) => t.insCode === item.insCode && t.row === 2)
        : null;
      const tableTrade = table
        ? table.find((t) => t.insCode === item.insCode && t.row === 9)
        : null;
      const status20Data = status20
        ? status20.find((t) => t.insCode === item.insCode)
        : null;
      const status50Data = status50
        ? status50.find((t) => t.insCode === item.insCode)
        : null;
      const beforeItem = beforeList
        ? beforeList.find((t) => t.insCode === item.insCode)
        : null;

      let sybmolInfo = 0;
      if (moment(item.date).format("YYYY-MM-DD") === date) {
        await delay(100);
        sybmolInfo = await TadbirApi.getSybmolInfo(item.isin);
      }

      const symbolInfoTset = await TsetmcApi.getSymbolInfo(item.insCode);

      console.log(item.name);

      let data = {
        name: item.name,
        fallResistancePercent: item.fallResistancePercent,
        fullerBasisVolume: item.fullerBasisVolume,
        avgNoBuy: tableQueue ? tableQueue.avgNoBuy : "-",
        percentAvgTradeBefore1130: tableTrade
          ? tableTrade.percentAvgTradeBefore1130
          : "-",
        fullerLegalBasisVolume: item.fullerLegalBasisVolume,
        maxMoney: sybmolInfo
          ? item.tomorrowMaxPrice * parseInt(sybmolInfo.mxp, 10)
          : "-",
        last20Date: status20Data
          ? moment(status20Data.lastDate).format("jYYYY-jMM-jDD")
          : "-",
        last50Date: status50Data
          ? moment(status50Data.lastDate).format("jYYYY-jMM-jDD")
          : "-",
        currentStatus:
          config.statusList[symbolInfoTset.status] || symbolInfoTset.status,
        percent20: status20Data ? status20Data.pricePercent : "-",
        countDay20: status20Data ? status20Data.countDay : "-",
        percent50: status50Data ? status50Data.pricePercent : "-",
        countDay50: status50Data ? status50Data.countDay : "-",

        volumeTrade: item.volumeTrade,
        volumeBuyReal: item.volumeBuyReal,
        volumeSellReal: item.volumeSellReal,
        volumeBuyLegal: item.volumeBuyLegal,
        volumeSellLegal: item.volumeSellLegal,

        noBuyReal: item.noBuyReal,
        noSellReal: item.noSellReal,
        noBuyLegal: item.noBuyLegal,
        noSellLegal: item.noSellLegal,

        maxVolumeOneTime: item.maxVolumeOneTime,
        maxVolumeTimeOneTime: item.maxVolumeTimeOneTime,
        maxVolumePriceOneTime: item.maxVolumePriceOneTime,
        tomorrowMaxPrice: sybmolInfo ? item.tomorrowMaxPrice : "-",
        linkTset: `http://www.tsetmc.com/Loader.aspx?ParTree=151311&i=${item.insCode}`,
        lastDate: moment(item.date).format("jYYYY-jMM-jDD"),
      };

      if (beforeItem) {
        data = {
          ...data,
          beforeFallResistancePercent: beforeItem.fallResistancePercent,
          beforeFullerBasisVolume: beforeItem.fullerBasisVolume,
          beforeNoBuyReal: beforeItem.noBuyReal,
          beforeFullerLegalBasisVolume: beforeItem.fullerLegalBasisVolume,
          beforeVolumeTrade: beforeItem.volumeTrade,
          beforeVolumeBuyReal: beforeItem.volumeBuyReal,
          beforeVolumeSellReal: beforeItem.volumeSellReal,
          beforeVolumeBuyLegal: beforeItem.volumeBuyLegal,
          beforeVolumeSellLegal: beforeItem.volumeSellLegal,
        };
      }

      result.push(data);
    }

    console.log(excel(date, result, !!specificDate));
  } catch (e) {
    console.log(e);
  }
};

const excel = (date, list, hasBeforeItem = false) => {
  let workbook = new Excel.Workbook();

  const worksheet = workbook.addWorksheet(`تحلیلگر بورس - ${date}`);
  worksheet.views = [{ rightToLeft: true }];
  worksheet.pageSetup.showGridLines = true;

  let rows = [
    "نماد",
    "مقاومت",
    "پرکردن مبنا",
    "میانگین نفرات صف خرید ساعت 8:30",
    "میانگین درصد حجم معاملات بعد از 11:30",
    "پرکردن مبنا، حقوقی",

    "نقدینگی یک سفارش",

    "آخرین تاریخ توقف 20 درصدی",
    "آخرین تاریخ توقف 50 درصدی",
    "وضعیت فعلی",
    "درصد رشد از آخرین توقف 20 درصدی",
    "تعداد روز از آخرین توقف 20 درصدی",
    "درصد رشد از آخرین توقف 50 درصدی",
    "تعداد روز از آخرین توقف 50 درصدی",

    "حجم معاملات",
    "حجم خرید حقیقی",
    "حجم فروش حقیقی",
    "حجم خرید حقوقی",
    "حجم فروش حقوقی",

    "تعداد خریدار حقیقی",
    "تعداد فروشنده حقیقی",
    "تعداد خریدار حقوقی",
    "تعداد فروشنده حقوقی",

    "حجم بیشترین معاملات در یک ثانیه",
    "تایم بیشترین معاملات در یک ثانیه",
    "قیمت بیشترین معاملات در یک ثانیه",
    "آستانه قیمت سقف فردا",

    "لینک به TSET",
    "آخرین تاریخ دریافت دیتا",
  ];
  if (hasBeforeItem) {
    rows.push("میانگین درصد مقاومت");
    rows.push("میانگین درصد پرکردن حجم مبنا");
    rows.push("میانگین تعداد خریدار حقیقی");
    rows.push("میانگین درصد پرکردن حجم مبنا توسط حقوقی");
    rows.push("میانگین حجم معاملات");
    rows.push("میانگین حجم خرید حقیقی");
    rows.push("میانگین حجم فروش حقیقی");
    rows.push("میانگین حجم خرید حقوقی");
    rows.push("میانگین حجم فروش حقوقی");
  }
  worksheet.addRow(rows);

  list.forEach((item, i) => {
    worksheet.addRow(Object.values(item));
  });

  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFBFBFBF" },
  };

  // worksheet.getColumn(1).width = 5;

  const fileName = `${__dirname}/analyzer_queue_${moment(date).format(
    "jYYYY-jMM-jDD"
  )}.xlsx`;
  workbook.xlsx.writeFile(fileName);
};

db.connect((err) => {
  if (err) throw err;
  console.log("Mysql connected!");
  main();
});

const getLastDate = () => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT date FROM analyzer ORDER BY date DESC LIMIT 1;`,
      (err, sqlResult) => {
        if (err || (sqlResult && sqlResult.length === 0)) {
          console.log(err);
          return reject();
        }
        return resolve(sqlResult[0].date);
      }
    );
  });
};

const getBeforeDays = (count = 5, beforeDay = null) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT DISTINCT date FROM analyzer ${
        beforeDay ? `WHERE date < '${beforeDay}'` : ""
      } ORDER BY date DESC LIMIT ${count}`,
      (err, sqlResult) => {
        if (err || (sqlResult && sqlResult.length === 0)) {
          console.log(err);
          return reject();
        }
        return resolve(
          sqlResult.map((r) => moment(r.date).format("YYYY-MM-DD"))
        );
      }
    );
  });
};

const getDataGroup = (
  date = null,
  beforeDate = null,
  beforeDateList = null
) => {
  return new Promise((resolve, reject) => {
    db.query(
      `SELECT
        f1.name,
        f1.insCode,
        f1.isin,
        f1.date,
        TRUNCATE(f1.fallResistancePercent,1) as fallResistancePercent,
        TRUNCATE(f1.fullerBasisVolume,1) as fullerBasisVolume,

        ROUND(f1.volumeTrade) as volumeTrade,
        ROUND(f1.volumeBuyReal) as volumeBuyReal,
        ROUND(f1.volumeSellReal) as volumeSellReal,
        ROUND(f1.volumeBuyLegal) as volumeBuyLegal,
        ROUND(f1.volumeSellLegal) as volumeSellLegal,

        ROUND(f1.noBuyReal) as noBuyReal,
        ROUND(f1.noSellReal) as noSellReal,
        ROUND(f1.noBuyLegal) as noBuyLegal,
        ROUND(f1.noSellLegal) as noSellLegal,
        
        TRUNCATE(f1.fullerLegalBasisVolume,1) as fullerLegalBasisVolume,
        f2.maxVolumeOneTime,
        f2.maxVolumePriceOneTime,
        f2.maxVolumeTimeOneTime,
        f2.status20percent,
        f2.status50percent,
        FLOOR(f2.finalPrice * 1.05) as tomorrowMaxPrice,
        f1.countDay,
        f1.Ids
      FROM (
        SELECT
          insCode,
          isin,
          name,
          AVG(fallResistancePercent) as fallResistancePercent,
          AVG(volumeTrade/basisVolume*100) as fullerBasisVolume,
          AVG(volumeSellLegal/basisVolume*100) as fullerLegalBasisVolume,
          
          AVG(volumeTrade) as volumeTrade,
          AVG(volumeBuyReal) as volumeBuyReal,
          AVG(volumeSellReal) as volumeSellReal,
          AVG(volumeBuyLegal) as volumeBuyLegal,
          AVG(volumeSellLegal) as volumeSellLegal,

          AVG(noBuyReal) as noBuyReal,
          AVG(noSellReal) as noSellReal,
          AVG(noBuyLegal) as noBuyLegal,
          AVG(noSellLegal) as noSellLegal,

          MAX(date) as date,
          COUNT(id) as countDay,
          GROUP_CONCAT(DISTINCT id SEPARATOR ',') AS Ids
        FROM analyzer
        ${date ? `WHERE date = '${date}'` : ""}
        ${
          beforeDateList
            ? `WHERE date IN (${beforeDateList.map((b) => `'${b}'`).join(",")})`
            : beforeDate
            ? `WHERE date < '${beforeDate}'`
            : ""
        }
        GROUP BY insCode
      ) as f1
      LEFT JOIN analyzer f2 ON f1.date = f2.date AND f1.insCode = f2.insCode
      ORDER BY
        fallResistancePercent DESC,
        fullerBasisVolume DESC,
        noBuyReal DESC`,
      (err, sqlResult) => {
        if (err || (sqlResult && sqlResult.length === 0)) {
          console.log(err);
          return reject();
        }
        return resolve(sqlResult);
      }
    );
  });
};

const getTableGroup = (
  date = null,
  beforeDate = null,
  beforeDateList = null
) => {
  return new Promise((resolve) => {
    db.query(
      `SELECT
        f1.name,
        f1.insCode,
        f1.row,
        TRUNCATE(100 - (AVG(f1.volumeTrade) / AVG(f1.totalVolumeTrade) * 100), 1) as percentAvgTradeBefore1130,
        AVG(f1.totalVolumeTrade) as avgTotalVolumeTrade,
        AVG(f1.volumeTrade) as avgVolumeTrade,
        ROUND(AVG(f1.noBuy)) as avgNoBuy,
        COUNT(f1.insCode) as countDay
      FROM
        (SELECT
          ant.*,
          a.name,
          a.insCode,
          a.volumeTrade as totalVolumeTrade
		    FROM analyzer_table ant
          INNER JOIN analyzer a ON a.id = ant.analyzerId
          ${date ? ` AND a.date = '${date}' ` : ""}
          ${
            beforeDateList
              ? ` AND a.date IN (${beforeDateList
                  .map((b) => `'${b}'`)
                  .join(",")}) `
              : beforeDate
              ? ` AND a.date < '${beforeDate}' `
              : ""
          }
    	    WHERE ant.row IN (2,9)
	    ) as f1
      GROUP BY f1.insCode, f1.row`,
      (err, sqlResult) => {
        if (err || (sqlResult && sqlResult.length === 0)) {
          console.log(err);
          return resolve(null);
        }
        return resolve(sqlResult);
      }
    );
  });
};

/**
 * @param {int} type 20 | 50
 */
const getStatus2050 = (type = 20) => {
  return new Promise((resolve) => {
    db.query(
      `SELECT
        af.*,
        COUNT(a.id) as countDay,
        TRUNCATE(SUM(5-(a.highPrice/a.finalPrice-1)*100), 2) as pricePercent
      FROM (
        SELECT
          name,
          insCode,
          MAX(date) as lastDate
        FROM analyzer
          WHERE status${type}percent = 1
        GROUP BY insCode
      ) as af
      LEFT JOIN analyzer a ON
        a.insCode = af.insCode AND
        a.date >= af.lastDate
      GROUP BY a.insCode`,
      (err, sqlResult) => {
        if (err || (sqlResult && sqlResult.length === 0)) {
          console.log(err);
          return resolve(null);
        }
        return resolve(sqlResult);
      }
    );
  });
};
