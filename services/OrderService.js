const moment = require("jalali-moment");
const nohm = require("nohm").Nohm;
const fs = require("fs");

const Order = require("../models/Order");
const UserService = require("./UserService");

const config = require("../config/index");
const TadbirApi = require("../helpers/TadbirApi");
const OnlineplusApi = require("../helpers/OnlineplusApi");
const AgahApi = require("../helpers/AgahApi");
const ExirApi = require("../helpers/ExirApi");
const FarabixoApi = require("../helpers/FarabixoApi");

const {
  removeDuplicates,
  currency,
  isString,
  delay,
  calculateQuantityByCredit,
  agahCategoryId,
} = require("../helpers");

class OrderService {
  constructor() {}

  static async findNewById(id) {
    try {
      const list = await this.listByCondition({ id, status: "new" });
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

  static async add(values) {
    try {
      const data = { ...values };
      if (data.userIds) delete data.userIds;

      const order = new Order();
      order.property({
        ...data,
        status: "new",
        createdAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      await order.save();

      const result = await this.findById(parseInt(order.id, 10));
      return result;
    } catch (e) {
      throw e;
    }
  }

  static async delete(id) {
    try {
      const order = await nohm.factory("Order");
      order.id = id;

      await order.remove({
        // options object can be omitted
        silent: true, // whether remove event is published. defaults to false.
      });
    } catch (e) {
      throw e;
    }
  }

  static async listByCondition(condition) {
    try {
      let orders = [];
      if (typeof condition === "number") {
        const order = await Order.load(condition); // id
        orders = order ? [order] : [];
      } else {
        orders = await Order.findAndLoad(condition);
      }

      const users = await UserService.list();

      if (orders.length === 0) {
        throw new Error("Not found NEW order");
      }

      const list = orders.map((order) => {
        const orderData = order.allProperties();
        const foundUser = users.find((user) => user.id === orderData.userId);

        return {
          ...orderData,
          id: parseInt(orderData.id, 10),
          user: foundUser,
        };
      });

      return list;
    } catch (e) {
      throw e;
    }
  }

  static async listByStatus(status = "new") {
    try {
      const list = await this.listByCondition({ status });
      return list;
    } catch (e) {
      throw e;
    }
  }

  static async listByUserId(userId, limitLast = null) {
    try {
      let list = await this.listByCondition({ userId });
      list = list.sort((a, b) => b.id - a.id);

      if (limitLast) list = list.slice(0, limitLast);

      return list;
    } catch (e) {
      throw e;
    }
  }

  static async update(id, updateValues) {
    try {
      const foundOrder = await Order.load(id);
      foundOrder.property({
        ...updateValues,
        updatedAt: moment().format("YYYY-MM-DD HH:mm:ss"),
      });

      await foundOrder.save();
      return foundOrder;
    } catch (e) {
      throw e;
    }
  }

  static async getRunAndSetStatus(botService) {
    try {
      const list = await this.listByStatus("run");

      let result = [];
      for (let i = 0; i < list.length; i++) {
        const order = list[i];

        let requestApi;
        switch (order.user.software) {
          case "onlineplus":
            requestApi = new OnlineplusApi(order.user.broker);
            break;
          case "agah":
            requestApi = new AgahApi(order.user.broker);
            requestApi.customerId = order.user.key;
            requestApi.customerTitle = order.user.name;
            break;
          case "exir":
            requestApi = new ExirApi(order.user.broker);
            break;
          case "farabixo":
            requestApi = new FarabixoApi(order.user.broker);
            break;
          default:
            throw "نرم افزار کارگزاری مشتری تعریف نشده است";
        }

        requestApi.isin = order.isin;
        requestApi.orderType = order.side;
        requestApi.price = order.price;
        requestApi.setHeaders(order.user.token || {});

        try {
          const details = await requestApi.getOrderTodayDetailsApi();

          let statusMessage = "";
          if (details) {
            await this.update(order.id, {
              status: details.statusType,
              statusText: details.status,
            });
            statusMessage = details.status;
          } else {
            await this.update(order.id, {
              status: "cancel",
              statusText: "cancel by customer",
            });
            statusMessage = "cancel";
          }

          result.push(
            `👨🏻 ${order.user.name} [${order.user.broker}]\n📈 ${
              order.isinName
            }\n🔎 وضعیت: ${statusMessage}${
              details.statusType === "done"
                ? `\n💰 قیمت: ${details.price}\n🧮 تعداد سهم: ${details.qunatity}`
                : ""
            }`
          );
        } catch (err) {
          result.push(
            `👨🏻 ${order.user.name} [${order.user.broker}]\n📈 ${
              order.isinName
            }\n🔎 وضعیت: ${
              JSON.stringify(err) === "{}" ? "نامشخص" : JSON.stringify(err)
            }`
          );
          this.update(order.id, {
            status: "cancel",
            statusText: "error by system",
          });
        }
      }

      if (result.length) {
        await botService.bot.telegram.sendMessage(
          config.botAdminIds[0],
          result.join("\n\n")
        );
      }

      return list;
    } catch (e) {
      botService.bot.telegram.sendMessage(
        config.botAdminIds[0],
        `خطا در get run and set status\n${isString(e) ? e : JSON.stringify(e)}`
      );
      throw e.toString();
    }
  }

  static async lastSymbols(attr = "isinName", count = 10, secondAttr = null) {
    try {
      let orders = await Order.findAndLoad();
      if (orders.length === 0) {
        throw new Error("Not found user");
      }

      orders = orders.sort((a, b) => b.id - a.id);

      let list = orders.map((order) => {
        let text = order.allProperties()[attr];
        if (secondAttr) text += ` - ${order.allProperties()[secondAttr]}`;
        return text;
      });

      list = removeDuplicates(list);
      list = list.slice(0, count);

      return list;
    } catch (e) {
      throw e;
    }
  }

  static async getCredit() {
    try {
      const list = await OrderService.listByStatus("new");

      let failedLoginList = [];
      let result = [];
      let sum = 0;
      for (let i = 0; i < list.length; i++) {
        const order = list[i];

        if (order.side === "buy") {
          let requestApi;
          switch (order.user.software) {
            case "onlineplus":
              requestApi = new OnlineplusApi(order.user.broker);
              break;
            case "agah":
              requestApi = new AgahApi(order.user.broker);
              requestApi.customerId = order.user.key;
              requestApi.customerTitle = order.user.name;
              break;
            case "exir":
              requestApi = new ExirApi(order.user.broker);
              break;
            case "farabixo":
              requestApi = new FarabixoApi(order.user.broker);
              break;
            default:
              throw "نرم افزار کارگزاری مشتری تعریف نشده است";
          }

          requestApi.setHeaders(order.user.token || {});

          try {
            const credit = await requestApi.getRemainPriceApi();

            result.push({
              credit: credit.accountBalance,
              text: `#${order.id} - ${
                order.user.username || order.user.key
              } \n👨🏻 ${order.user.name} [${order.user.broker}]\n📈 خرید ${
                order.isinName
              }\n💰 موجودی: ${currency(credit.accountBalance)}${
                credit.blockedBalance > 0
                  ? `\n⛔️ بلوکه شده: ${currency(credit.blockedBalance)}`
                  : ""
              }${
                order.side === "buy" && credit.accountBalance < 5000000
                  ? `\n‼️ موجودی کاربر کافی نمی‌باشد`
                  : ""
              }\n🧨 /run_order_${order.id}`,
            });

            sum += credit.accountBalance;
          } catch (err) {
            failedLoginList.push(order.user.id);
            result.push({
              credit: 0,
              text: `#${order.id} - ${
                order.user.username || order.user.key
              }\n👨🏻 ${order.user.name} [${
                order.user.broker
              }]\n❗️ خطا در گرفتن موجودی\n🧨 /run_order_${order.id}`,
            });
          }
        } else {
          result.push({
            credit: -1,
            text: `#${order.id} - ${
              order.user.username || order.user.key
            } \n👨🏻 ${order.user.name} [${order.user.broker}]\n✂️ فروش ${
              order.isinName
            }\n🧨 /run_order_${order.id}`,
          });
        }
      }

      if (result.length > 0) {
        result = result.sort((a, b) => b.credit - a.credit).map((i) => i.text);
      }

      return { result, sum, orderCount: list.length, failedLoginList };
    } catch (e) {
      throw e.toString();
    }
  }

  static async checkCredit(botService) {
    try {
      const { result } = await this.getCredit();

      if (result.length) {
        await botService.bot.telegram.sendMessage(
          config.botAdminIds[0],
          result.join("\n\n")
        );
      }

      return result;
    } catch (e) {
      botService.bot.telegram.sendMessage(
        config.botAdminIds[0],
        `خطا در check credit\n${isString(e) ? e : JSON.stringify(e)}`
      );
      throw e;
    }
  }

  static async list() {
    try {
      const order = await Order.findAndLoad();
      if (order.length === 0) {
        throw new Error("Not found order");
      }

      return order.map((order) => ({
        ...order.allProperties(),
        id: parseInt(order.id, 10),
      }));
    } catch (e) {
      throw e;
    }
  }

  static async sqlBackup() {
    try {
      const list = await this.list();

      const fileName = `./backup/order_backup_${moment().format(
        "YYYY_MM_DD"
      )}.sql`;

      fs.appendFileSync(
        fileName,
        "INSERT INTO `order` (`id`, `userId`, `isin`, `isinName`, `side`, `price`, `quantity`, `startTime`, `endTime`, `delay`, `status`, `statusText`, `server`, `position`, `volumetricPosition`, `positionCreatedAt`, `createdAt`, `updatedAt`) VALUES\n"
      );

      list.forEach((order) => {
        fs.appendFileSync(
          fileName,
          `(${order.id}, ${order.userId}, '${order.isin}', '${order.isinName}', '${order.side}', ${order.price}, ${order.quantity}, '${order.startTime}', '${order.endTime}', ${order.delay}, '${order.status}', '${order.statusText}', '${order.server}', ${order.position}, '${order.volumetricPosition}', '${order.positionCreatedAt}', '${order.createdAt}', '${order.updatedAt}'),\n`
        );
      });

      return fileName;
    } catch (e) {
      throw e;
    }
  }

  static async connectBrokerByUser(userId) {
    try {
      const user = await UserService.findById(userId);

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

  static async sendFastOrder(order, percentQuantity = null) {
    try {
      const { requestApi } = await this.connectBrokerByUser(order.user.id);

      requestApi.isin = order.isin;
      requestApi.orderType = order.side;
      requestApi.price = order.price;

      let credit = {};
      if (order.side === "buy") {
        credit = await requestApi.getRemainPriceApi();
        if (percentQuantity) {
          credit.accountBalance = Math.floor(
            (credit.accountBalance * percentQuantity) / 100
          );
        }
      }

      const sybmolInfo = await TadbirApi.getSybmolInfo(requestApi.isin);
      const maxPrice = parseInt(sybmolInfo.mxp, 10);

      order.quantity = parseInt(order.quantity, 10);
      if (order.quantity > maxPrice) {
        requestApi.quantity = maxPrice;

        // update quantity order by id
        await this.update(order.id, {
          quantity: requestApi.quantity,
          status: "run",
        });
      } else {
        requestApi.quantity = order.quantity;
      }

      if (requestApi.quantity === 0 || !requestApi.quantity) {
        if (order.side === "buy") {
          requestApi.quantity = calculateQuantityByCredit(
            credit.accountBalance,
            requestApi.price
          );
        } else {
          const portfolio = await requestApi.getPortfolioSymbol();
          let countPortfolio = parseInt(portfolio.count, 10);

          if (percentQuantity) {
            countPortfolio = Math.floor(
              (countPortfolio * percentQuantity) / 100
            );
          }
          requestApi.quantity = countPortfolio;
        }

        if (!requestApi.quantity) {
          throw new Error("Quantity is zero");
        }

        if (requestApi.quantity > maxPrice) {
          if (order.side === "buy") {
            requestApi.quantity = maxPrice;
          } else {
            requestApi.quantity = Math.floor(
              requestApi.quantity / Math.ceil(requestApi.quantity / maxPrice)
            );
          }
        }

        // update quantity order by id
        await this.update(order.id, {
          quantity: requestApi.quantity,
          status: "run",
        });
      }

      if (order.user.software === "agah") {
        await requestApi.getInstrumentInfo();
        requestApi.prepareNonceOption();
        requestApi.prepareSendOrderBodyData();
        const catId = agahCategoryId();

        const { nonce, categoryId } = await requestApi.generateNonce(catId);
        const { body, catyId } = await requestApi.sendOrderApi(
          nonce,
          categoryId
        );
        console.log(catyId, body);
      } else {
        requestApi.prepareSendOrderOption();

        const { body, number } = await requestApi.sendOrderApi(1);
        if (body && !body.IsSuccessfull) {
          throw body.MessageDesc;
        }
        console.log(`num_${number}`, body);
      }

      await delay(10000);

      const details = await requestApi.getOrderDetailsApi();
      if (details.length > 0) {
        await this.update(order.id, {
          position: details[details.length - 1].position,
          volumetricPosition: details[details.length - 1].volumetricPosition,
          positionCreatedAt: details[details.length - 1].createdAt,
          statusText: details[details.length - 1].status,

          result: details.map((d) => {
            if (d.statusType === "done")
              return {
                position: d.position,
                volumetricPosition: d.volumetricPosition,
                statusText: d.status,
                positionCreatedAt: d.createdAt,
              };
          }),
        });
      } else {
        await this.update(order.id, { status: "failed" });
      }

      return true;
    } catch (e) {
      throw `مشکلی پیش آمده است\n${
        e && e.message ? e.message : JSON.stringify(e)
      }`;
    }
  }
}

module.exports = OrderService;
