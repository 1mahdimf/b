const moment = require("moment");
const fs = require("fs");

const User = require("../models/User");
const OnlineplusApi = require("../helpers/OnlineplusApi");
const AgahApi = require("../helpers/AgahApi");
const ExirApi = require("../helpers/ExirApi");
const FarabixoApi = require("../helpers/FarabixoApi");

const {
  digit,
  currency,
  isString,
  currencyAlpha,
  roundCurrency,
} = require("../helpers");

class UserService {
  constructor() {}

  static async findIdByKey(key) {
    try {
      const ids = await User.find({
        key,
      });

      if (ids.length === 0) {
        return null;
      }

      return ids[0];
    } catch (e) {
      throw e;
    }
  }

  static async update(id, updateValues) {
    try {
      const foundUser = await User.load(id);
      foundUser.property(updateValues);

      await foundUser.save();
      return foundUser;
    } catch (e) {
      throw e;
    }
  }

  static async updateTokenByKey(key, token) {
    try {
      const id = await this.findIdByKey(key);
      const result = await this.update(id, {
        token,
        tokenUpdatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      return result;
    } catch (e) {
      throw e;
    }
  }

  static async add(values) {
    try {
      const findId = await this.findIdByKey(values.key);
      if (findId) {
        throw new Error("User exists");
      }

      const user = new User();
      user.property({
        ...values,
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      await user.save();

      const newFindId = await this.findIdByKey(values.key);
      const newUser = await this.findById(newFindId);
      return newUser;
    } catch (e) {
      throw e;
    }
  }

  static async list() {
    try {
      const users = await User.findAndLoad();
      if (users.length === 0) {
        throw new Error("Not found user");
      }

      return users.map((user) => ({
        ...user.allProperties(),
        id: parseInt(user.id, 10),
      }));
    } catch (e) {
      throw e;
    }
  }

  static async listForOrder() {
    try {
      const users = await User.findAndLoad();
      if (users.length === 0) {
        throw new Error("Not found user");
      }

      const list = users.map((user) => ({
        ...user.allProperties(),
        id: parseInt(user.id, 10),
      }));

      return list.sort(
        (a, b) =>
          moment(b.tokenUpdatedAt).format("X") -
          moment(a.tokenUpdatedAt).format("X")
      );
    } catch (e) {
      throw e;
    }
  }

  static async listByCondition(condition) {
    try {
      let users = [];
      if (typeof condition === "number") {
        const user = await User.load(condition); // id
        users = user ? [user] : [];
      } else {
        users = await User.findAndLoad(condition);
      }

      if (users.length === 0) {
        throw new Error("Not found user");
      }

      const list = users.map((user) => {
        const userData = user.allProperties();

        return {
          ...userData,
          id: parseInt(userData.id, 10),
        };
      });

      return list;
    } catch (e) {
      throw e;
    }
  }

  static async findByKey(key) {
    try {
      const list = await this.listByCondition({ key });
      return list[0];
    } catch (e) {
      throw e;
    }
  }

  static async findById(id) {
    try {
      const list = await this.listByCondition(id);
      return list[0];
    } catch (e) {
      throw e;
    }
  }

  static async searchByName(name, broker) {
    const reNameStart = new RegExp(`^${name.trim()}`, "i");
    const reNameFull = new RegExp(name.trim(), "i");

    let reBrokerFull = null;
    if (broker) {
      reBrokerFull = new RegExp(broker.trim(), "i");
    }

    try {
      const list = await this.listForOrder();

      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (item.inactive === 1) continue;

        if (item.name.match(reNameStart)) {
          if (broker) {
            if (item.broker.match(reBrokerFull)) {
              return item;
            } else {
              continue;
            }
          } else {
            return item;
          }
        }
      }

      for (let i = 0; i < list.length; i++) {
        if (list[i].inactive === 1) continue;

        if (list[i].name.match(reNameFull)) {
          if (broker) {
            if (item.broker.match(reBrokerFull)) {
              return item;
            } else {
              continue;
            }
          } else {
            return list[i];
          }
        }
      }

      return null;
    } catch (e) {
      throw e;
    }
  }

  static async connectBrokerByUser(userId) {
    try {
      const user = await this.findById(userId);

      let requestApi;
      switch (user.software) {
        case "onlineplus":
          requestApi = new OnlineplusApi(user.broker);
          break;
        case "agah":
          requestApi = new AgahApi(user.broker);
          requestApi.customerId = user.key;
          requestApi.customerTitle = user.name;
          break;
        case "exir":
          requestApi = new ExirApi(user.broker);
          break;
        case "farabixo":
          requestApi = new FarabixoApi(user.broker);
          break;
        default:
          throw "نرم افزار کارگزاری مشتری تعریف نشده است";
      }

      requestApi.setHeaders(user.token || {});
      return { requestApi, user };
    } catch (e) {
      throw e.toString();
    }
  }

  static async getUserOpenOrder(userId) {
    try {
      const { requestApi, user } = await this.connectBrokerByUser(userId);

      let result = [];
      const details = await requestApi.getOrderListApi();

      if (details.length > 0) {
        details.forEach((detail) => {
          if (detail.statusType === "done") {
            result.push(
              `👨🏻 ${user.name} [${user.broker}]\n📈 ${
                detail.side === "buy" ? "خرید" : "فروش"
              } ${detail.isinName}\n💰 ${currency(
                detail.price
              )}\n🧮 تعداد: ${digit(detail.qunatity)}\n🥇 جایگاه: ${digit(
                detail.position
              )}\n🎖 جایگاه حجمی: ${digit(
                detail.volumetricPosition
              )}\n🔎 وضعیت: ${detail.status}\n⌚ زمان: ${moment(
                detail.createdAt
              ).format("HH:mm:ss")}\n/cancel_order_${userId}_${detail.orderId}`
            );
          }
        });
        return result;
      }
      throw new Error("Open order not exists");
    } catch (e) {
      throw `مشکلی پیش آمده است\n\n${
        e && e.message ? e.message : JSON.stringify(e)
      }`;
    }
  }

  static async getUserTodayOrder(userId) {
    try {
      const { requestApi } = await this.connectBrokerByUser(userId);

      let result = [];
      const details = await requestApi.getOrderTodayListApi();

      details.forEach((detail) => {
        if (detail.statusType === "done") {
          result.push(
            `📈 ${detail.side === "buy" ? "خرید" : "فروش"} ${
              detail.isinName
            }\n💰 ${currency(detail.price)}\n🧮 تعداد: ${digit(
              detail.qunatity
            )}\n🥇 جایگاه: ${digit(detail.position)}\n🎖 جایگاه حجمی: ${digit(
              detail.volumetricPosition
            )}\n🔎 وضعیت: ${detail.status}\n⌚ زمان: ${moment(
              detail.createdAt
            ).format("HH:mm:ss")}`
          );
        }
      });

      if (result.length > 0) {
        return result;
      }
      throw new Error("Today order not exists");
    } catch (e) {
      throw `مشکلی پیش آمده است\n\n${
        e && e.message ? e.message : JSON.stringify(e)
      }`;
    }
  }

  static async getPortfolio(userId) {
    try {
      const { requestApi, user } = await this.connectBrokerByUser(userId);

      let result = [];
      const details = await requestApi.getPortfolioRealTime();

      details.forEach((detail) => {
        result.push({
          user,
          symbol: detail,
          text: `# ${detail.isin}\n📈 ${
            detail.isinName
          }\n💰 قیمت هر سهم: ${currency(detail.price)}\n💎 تعداد: ${digit(
            detail.quantity
          )}\n💵 قیمت کل: ${currency(detail.totalPrice)}\n${currencyAlpha(
            roundCurrency(detail.totalPrice)
          )}\n📊 درصد پرتفوی: ${detail.percent}%\n📐 سود/ضرر با قیمت پایانی: ${
            detail.finalPricePercent
          }%\n📏 سود/ضرر با آخرین قیمت: ${detail.lastTradePricePercent}%`,
        });
      });

      if (result.length > 0) {
        return result;
      }
      throw new Error("portfolio is empty");
    } catch (e) {
      throw `مشکلی پیش آمده است\n\n${
        e && e.message ? e.message : JSON.stringify(e)
      }`;
    }
  }

  static async getUserCredit(userId) {
    try {
      const { requestApi, user } = await this.connectBrokerByUser(userId);
      const credit = await requestApi.getRemainPriceApi();

      return `👨🏻 ${user.name} [${user.broker}]\n💰 موجودی: ${currency(
        credit.accountBalance
      )}${
        credit.blockedBalance > 0
          ? `\n⛔ بلوکه شده: ${currency(credit.blockedBalance)}`
          : ""
      }`;
    } catch (e) {
      throw `مشکلی پیش آمده است\n\n${
        e && e.message ? e.message : JSON.stringify(e)
      }`;
    }
  }

  static async cancelOrder(userId, orderId) {
    try {
      const { requestApi } = await this.connectBrokerByUser(userId);
      const result = await requestApi.cancelOrders([orderId]);

      if (result && result.length > 0) {
        return result[0].Message;
      }
      throw new Error("موردی پاسخ داده نشد");
    } catch (e) {
      throw `مشکلی پیش آمده است\n\n${
        e && e.message ? e.message : JSON.stringify(e)
      }`;
    }
  }

  static async getCreditUsersActive() {
    try {
      const list = await this.list();

      let result = [];
      for (let i = 0; i < list.length; i++) {
        const user = list[i];

        const tokenMoment = moment(user.tokenUpdatedAt, "YYYY-MM-DD HH:mm:ss");
        if (tokenMoment.isBefore(moment().subtract(24, "h"))) continue;

        try {
          const { requestApi } = await this.connectBrokerByUser(user.id);
          const credit = await requestApi.getRemainPriceApi();

          result.push({
            credit: credit.accountBalance,
            text: `${user.key}\n👨🏻 ${user.name} [${
              user.broker
            }]\n💰 موجودی: ${currency(credit.accountBalance)}\n${
              credit.blockedBalance > 0
                ? `⛔ بلوکه شده: ${currency(credit.blockedBalance)}\n`
                : ""
            }/order_add_${user.id}`,
          });
        } catch (err) {
          result.push({
            credit: 0,
            text: `👨🏻 ${user.name} [${user.broker}]\n❗ خطا در گرفتن موجودی`,
          });
        }
      }

      if (result.length > 0) {
        result = result.sort((a, b) => b.credit - a.credit).map((i) => i.text);
      }
      return result;
    } catch (e) {
      throw e;
    }
  }

  static async loginUsersActive(reply = null) {
    try {
      const list = await this.list();

      let message = "";
      let result = [];
      for (let i = 0; i < list.length; i++) {
        const user = list[i];

        if (user.inactive === "1") continue;

        try {
          if (!user.username || !user.password) {
            message = `👨🏻 ${user.name} [${user.broker}]\n❗ نام کاربری یا کلمه عبور برای این حساب ثبت نشده است`;
            result.push(message);
            if (reply) reply(message);
            continue;
          }

          const { requestApi } = await this.connectBrokerByUser(user.id);

          const cookies = await requestApi.login(user.username, user.password);
          if ((cookies && cookies.length === 0) || !cookies) {
            message = `👨🏻 ${user.name} [${user.broker}]\n❗توکن کاربر دریافت نشد`;
            result.push(message);
            if (reply) reply(message);
            await delay(10000);
            continue;
          }

          await this.update(userId, {
            token: { cookie: cookies.join(";") },
            tokenUpdatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
          });

          message = `${user.key}\n✅ ${user.name} [${user.broker}]\n💰 لاگین کاربر با موفقیت انجام شد\n/order_add_${user.id}`;
          result.push(message);
          if (reply) reply(message);
        } catch (err) {
          let error = err ? JSON.stringify(err) : "خطای نامشخص";
          if (isString(err)) error = err;

          message = `👨🏻 ${user.name} [${user.broker}]\n❗ ${error}`;
          result.push();
          if (reply) reply(message);
        }

        await delay(10000);
      }

      return result;
    } catch (e) {
      throw e;
    }
  }

  static async loginById(userId) {
    try {
      const { requestApi, user } = await this.connectBrokerByUser(userId);

      if (!user.username || !user.password) {
        throw new Error(
          `نام کاربری یا کلمه عبور ${user.name} [${user.broker}] ثبت نشده است`
        );
      }

      const cookies = await requestApi.login(user.username, user.password);
      if ((cookies && cookies.length === 0) || !cookies) {
        throw new Error(`توکن ${user.name} [${user.broker}] دریافت نشد`);
      }
console.log(cookies);

      await this.update(userId, {
        token: { cookie: cookies.join(";") },
        tokenUpdatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      return `لاگین ${user.name} [${user.broker}] با موفقیت انجام شد`;
    } catch (e) {
      throw e;
    }
  }

  static async sqlBackup() {
    try {
      const list = await this.list();

      const fileName = `./backup/user_backup_${moment().format(
        "YYYY_MM_DD"
      )}.sql`;

      fs.appendFileSync(
        fileName,
        "INSERT INTO `user` (`id`, `key`, `name`, `software`, `broker`, `username`, `password`, `inactive`, `createdAt`) VALUES\n"
      );

      list.forEach((user) => {
        fs.appendFileSync(
          fileName,
          `(${user.id}, '${user.key}', '${user.name}', '${user.software}', '${user.broker}', '${user.username}', '${user.password}', '${user.inactive}', '${user.createdAt}'),\n`
        );
      });

      return fileName;
    } catch (e) {
      throw e;
    }
  }
}

module.exports = UserService;
