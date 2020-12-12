/**
 * node company.js --date 2020-05-17
 */
const Excel = require("exceljs");
const moment = require("jalali-moment");
const argv = require("minimist")(process.argv.slice(2));

const TsetmcApi = require("../helpers/TsetmcApi");
const TadbirApi = require("../helpers/TadbirApi");
const { delay } = require("../helpers");

const main = async () => {
  let faildList = [];
  let result = [];

  const date = argv.date || "2020-05-27";

  try {
    let list = await TadbirApi.getSybmolDetailsList();
    list = list.map((item) => ({ ...item, retry: 0 }));

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
      await delay(50);

      console.log("start getDetailsSymbol");

      let info = { zTitad: 0 };
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

      console.log("start getSymbolInfoMain");

      let data = { finalPrice: 0 };
      data = await TsetmcApi.getDetailsSymbolRepeter(item.insCode);
      if (!data) {
        console.log("faild get details data");
        if (item.retry < 2) {
          list.push({ ...item, retry: item.retry + 1 });
        } else {
          faildList.push(item);
        }
        continue;
      }

      const values = {
        name: item.name,
        zTitad: info.zTitad,
        finalPrice: data.finalPrice,
        sum: info.zTitad * data.finalPrice,
      };
      result.push(values);

      console.log(values);
    }

    console.log(excel(date, result));
  } catch (e) {
    console.log(excel(date, result));
    console.log(e);
  }

  if (faildList.length > 0) {
    console.log("-----------------------");
    console.log(faildList.map((f) => `${f.name} - ${f.insCode}`).join("\n"));
  }
};

const excel = (date, list) => {
  let workbook = new Excel.Workbook();

  const worksheet = workbook.addWorksheet(`ارزش شرکت ها - ${date}`);
  worksheet.views = [{ rightToLeft: true }];
  worksheet.pageSetup.showGridLines = true;

  worksheet.addRow(["نماد", "تعداد سهام", "قیمت پایانی", "ارزش سهام شرکت"]);

  list.forEach((item, i) => {
    worksheet.addRow(Object.values(item));
  });

  worksheet.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FFBFBFBF" },
  };

  const fileName = `${__dirname}/analyzer_company_${moment(date).format(
    "jYYYY-jMM-jDD"
  )}.xlsx`;
  workbook.xlsx.writeFile(fileName);
};

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

main();
