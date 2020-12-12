module.exports = {
  myApiToken:
    "Bearer J3bHCcCBf0oh3UPC3zkUFvkcjdJgASDKnLXOi947jy9HyIekgIdqofpXNhIvLRUY", // change in extension

  myApiUrl: "http://185.173.104.135:3000",
  // myApiUrl: "http://127.0.0.1:3000",

  botToken: "1133578876:AAEMD8VEhCyXNbhDPvycGswKFZeYEMeXjko",
  alertBotToken: "1207522997:AAF7UJbvphcxUQ8CsmYFNTMKf3XN35gFUds",
  nazerBotToken: "1164111864:AAEHJYz3n2YmkbZ-wQ82cqZ9wWNv0l94Lrc",
  botAdminIds: [114463063, 757721911],
  botUseProxy: true,
  botProxyHost: "127.0.0.1",
  botProxyPort: 9050, //1080,
  botNotificationUserIds: [
    114463063,
    757721911,
    393231021,
    1051464623,
    34204091,
    107699448,
    101554083,
    76100376,
    864079492,
    237412164,
    395317922,
    108232662,
    197771944,
  ],
  botNotificationUserName: {
    114463063: "جواد",
    757721911: "مرتضی",
    393231021: "مهدی",
    1051464623: "جی",
    34204091: "کوثر",
    107699448: "سجاد",
    101554083: "نبی",
    76100376: "حامد",
    864079492: "رضا",
    237412164: "رضا حبیب تمر",
    395317922: "علمیه",
    108232662: "سینا جدیدی",
    197771944: "بابا",
  },
  botNazerUserIds: [
    114463063,
    757721911,
    393231021,
    1051464623,
    34204091,
    107699448,
    101554083,
    76100376,
    864079492,
    237412164, // Reza Habibtamar
    395317922,
    108232662,
    197771944,
  ],

  startTime: "08:29:40",
  endTime: "08:30:05",
  delay: 20, // ms

  serverList: [
    "iran_79.175.176.111",
    "iran_185.173.104.135",
    "iran_79.175.176.169",
    "german_46.4.144.70",
    "me_laptop",
    "me_pc",
  ],

  serverChooseList: [
    "afranet - 79.175.176.111",
    "afranet - 79.175.176.196",
    "afranet - 79.175.151.239",
    "hostiran - 185.173.104.135",
    "hostiran - 185.173.106.30",
    "hostiran - 185.173.104.66",
    "onlineserver - 185.81.96.46",
    "parspack - 194.5.205.39",
    "serverIR - 185.211.59.171",
    "german - 46.4.144.70",
  ],

  statusList: {
    I: "ممنوع",
    IS: "ممنوع-متوقف",
    IR: "ممنوع-محفوظ",
    A: "مجاز",
    AR: "مجاز-محفوظ",
    AS: "مجاز-متوقف",
  },

  statusTadbirToTset: {
    8: { title: "ممنوع،محفوظ", code: "IR" },
    7: { title: "ممنوع،متوقف", code: "IS" },
    6: { title: "ممنوع،مسدود", code: "IG" },
    5: { title: "ممنوع", code: "I" },
    4: { title: "مجاز،محفوظ", code: "AR" },
    3: { title: "مجاز،متوقف", code: "AS" },
    2: { title: "مجاز،مسدود", code: "AG" },
    1: { title: "مجاز", code: "A" },
    0: { title: "عرضه نشده", code: "" },
  },

  brokerList: [
    [
      {
        text: "mofid",
      },
      {
        text: "mobin",
      },
      {
        text: "agah",
      },
    ],
    [
      {
        text: "rahbord",
      },
      {
        text: "moshaveransaham",
      },
      {
        text: "sabajahad",
      },
    ],
    [
      {
        text: "maskan",
      },
      {
        text: "meli",
      },
      {
        text: "farabi",
      },
    ],
    [
      {
        text: "sepehr",
      },
      {
        text: "sahmeashna",
      },
      {
        text: "dana",
      },
    ],
    [
      {
        text: "parsian",
      },
      {
        text: "seavolex",
      },
      {
        text: "atisaz",
      },
    ],
    [
      {
        text: "eghtesadebidar",
      },
      {
        text: "danayanpars",
      },
      {
        text: "arzeshafarin",
      },
    ],
    [
      {
        text: "karamad",
      },
      {
        text: "saman",
      },
      {
        text: "keshavarzi",
      },
    ],
    [
      {
        text: "isatis",
      },
      {
        text: "kian",
      },
      {
        text: "sarmayehdanesh",
      },
    ],
    [
      {
        text: "khavarmianeh",
      },
      {
        text: "mehrafarin",
      },
      {
        text: "ordibehesht",
      },
    ],
    [
      {
        text: "dey",
      },
      {
        text: "sabatamin",
      },
      {
        text: "nahayatnegar",
      },
    ],
  ],

  softwareList: [
    [
      {
        text: "onlineplus",
      },
      {
        text: "agah",
      },
    ],
    [
      {
        text: "exir",
      },
      {
        text: "farabixo",
      },
    ],
    [
      {
        text: "nahayatnegar",
      },
    ],
  ],
};
