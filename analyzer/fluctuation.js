const moment = require("jalali-moment");

const TsetmcApi = require("../helpers/TsetmcApi");
const TadbirApi = require("../helpers/TadbirApi");
const { delay } = require("../helpers");

const db = require("./db");

const isinList = [
  "IRO3ZOBZ0001",
  "IRO1BTEJ0001",
  "IRO1PNES0001",
  "IRO1TAMN0001",
  "IRO1SIPA0001",
  "IRO1PNBA0001",
  "IRO1BMLT0001",
  "IRO1SLMN0001",
  "IRO1PTEH0001",
  "IRO1RSAP0001",
  "IRO3TPEZ0001",
  "IRO1GOST0001",
  "IRO1SSAP0001",
  "IRO1OFRS0001",
  "IRO1IKCO0001",
  "IRO3STIZ0001",
  "IRO1MADN0001",
  "IRO1SKBV0001",
  "IRO1BSDR0001",
  "IRO1PKLJ0001",
  "IRO7HPKP0001",
  "IRO3MEAZ0001",
  "IRO1SSIN0001",
  "IRO1FKHZ0001",
  "IRO1KOSR0001",
  "IRO1ZMYD0001",
  "IRO1OIMC0001",
  "IRO3BDMZ0001",
  "IRO3FRBZ0001",
  "IRO7BSHP0001",
  "IRO3AVLZ0001",
  "IRO1TMLT0001",
  "IRO1KSHJ0001",
  "IRO1TAYD0001",
  "IRO3GHSZ0001",
  "IRO1BORS0001",
  "IRO1SHFS0001",
  "IRO7PSDP0001",
  "IRO7KFRP0001",
  "IRO1DARO0001",
  "IRO3FAYZ0001",
  "IRO1MSMI0001",
  "IRO1NIRO0001",
  "IRO1MKBT0001",
  "IRO1LTOS0001",
];

const dateList = [
  "2020-06-16",
  "2020-06-15",
  "2020-06-14",
  "2020-06-13",
  "2020-06-10",
  "2020-06-09",
  "2020-06-08",
  "2020-06-07",
  "2020-06-06",
  "2020-06-02",
  "2020-06-01",
  "2020-05-31",
  "2020-05-30",
  "2020-05-27",
  "2020-05-26",
  "2020-05-23",
  "2020-05-20",
  "2020-05-19",
  "2020-05-18",
  "2020-05-17",
  "2020-05-16",
];

const main = async () => {
  try {
    const symbolList = await TadbirApi.getSybmolDetailsList();

    for (let l = 0; l < isinList.length; l++) {
      const isin = isinList[l];
      const symbol = symbolList.find(s => s.isin === isin);

      for (let d = 0; d < dateList.length; d++) {
        let date = dateList[d];

        console.log(symbol.name, symbol.insCode, date);

        const findInDb = await selectAnalyzerByInsCodeAndDate(
          symbol.isin,
          date
        );
        if (findInDb) continue;

        try {
          const { queueList } = await TsetmcApi.getQueueByDate(symbol, date);

          for (let q = 0; q < queueList.length; q++) {
            await insertAnalyzerQueue(queueList[q]);
            console.log("insert", q);
          }

          await delay(5);
        } catch (e) {
          console.log(e);
          await delay(5);
          continue;
        }
      }
    }
  } catch (e) {
    console.log(e);
  }
};

db.connect(err => {
  if (err) throw err;
  console.log("Mysql connected!");
  main();
});

const insertAnalyzerQueue = values => {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO analyzer_queue (\
        id, \
        name, \
        isin, \
        date, \
        time, \
        priceBuy, \
        noBuy, \
        volumeBuy, \
        priceSell, \
        noSell, \
        volumeSell, \
        volumeTrade, \
        countTrade \
      )\
      VALUES (\
        NULL, \
        '${values.name}', \
        '${values.isin}', \
        '${values.date}', \
        '${values.time}', \
        '${values.priceBuy}', \
        '${values.noBuy}', \
        '${values.volumeBuy}', \
        '${values.priceSell}', \
        '${values.noSell}', \
        '${values.volumeSell}', \
        '${values.volumeTrade}', \
        '${values.countTrade}' \
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

const selectAnalyzerByInsCodeAndDate = (isin, date) => {
  return new Promise(resolve => {
    db.query(
      `SELECT id FROM analyzer_queue WHERE isin = '${isin}' AND date = '${date}' LIMIT 1;`,
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
