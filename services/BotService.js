const request = require("request");
const Telegraf = require("telegraf");
const session = require("telegraf/session");
const SocksAgent = require("socks5-https-client/lib/Agent");
const moment = require("jalali-moment");

const UserService = require("./UserService");
const OrderService = require("./OrderService");
const AnalyzerService = require("./AnalyzerService");

const TadbirApi = require("../helpers/TadbirApi");
const {
  calculatePrice,
  currency,
  delay,
  digit,
  paginationFilterList,
  paginationInlineKeyboard,
  currencyAlpha,
  roundCurrency,
} = require("../helpers");
const config = require("../config");

class BotService {
  constructor() {
    const options = {};
    if (config.botUseProxy) {
      const socksAgent = new SocksAgent({
        socksHost: config.botProxyHost,
        socksPort: config.botProxyPort,
      });
      options.agent = socksAgent;
    }

    this.bot = new Telegraf(config.botToken, { telegram: options });
    this.bot.use(session());
    this.bot.use(this.useAccess);
  }

  useAccess({ from, reply }, next) {
    if (config.botAdminIds.indexOf(from.id) === -1) {
      return reply("Access deny");
    }
    return next();
  }

  setContext(ctx) {
    this.reply = ctx.reply;
    this.text = ctx.message && ctx.message.text ? ctx.message.text : null;
    this.session = ctx.session;
  }

  async replyToAdmin(text, extra = null) {
    try {
      await botService.bot.telegram.sendMessage(
        config.botAdminIds[0],
        text,
        extra
      );
    } catch (e) {
      throw e;
    }
  }

  async infoUserById() {
    const match = this.text.match(/^\/info_user_(\d+)$/i);
    if (match) {
      try {
        const user = await UserService.findById(parseInt(match[1], 10));

        this.reply(
          `${user.key}\n👨🏻 ${user.name}\n💻 ${user.software} [${
            user.broker
          }]\n\n💳 ${user.username}\n🔒 ${user.password}\n\n💡 وضعیت اکانت **${
            user.inactive === 1 ? "غیرفعال" : "فعال"
          }**`,
          {
            reply_markup: {
              remove_keyboard: true,
            },
          }
        );
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }
      return true;
    }
    return false;
  }

  async loginUserById() {
    const match = this.text.match(/^\/login_user_(\d+)$/i);
    if (match) {
      try {
        const message = await UserService.loginById(parseInt(match[1], 10));

        this.reply(message, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }
      return true;
    }
    return false;
  }

  async groupLoginUser() {
    if (this.text === "/group_login") {
      try {
        const userIds = this.session.newOrder.userIds;

        for (let i = 0; i < userIds.length; i++) {
          const userId = userIds[i];

          try {
            const message = await UserService.loginById(userId);
            this.reply(message);
          } catch (err) {
            this.reply(err);
          }

          await delay(1000);
        }

        this.reply("لاگین همه کاربران انجام شد", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  editUserById() {
    const match = this.text.match(/^\/user_edit_(\d+)$/i);
    if (match) {
      this.session.editUser = {
        id: parseInt(match[1]),
      };
      this.session.nextStep = "select_user_attribute";
      this.reply("چی رو میخوایی تغییر بدی؟", {
        reply_markup: {
          resize_keyboard: true,
          keyboard: [
            [{ text: "key" }, { text: "name" }],
            [{ text: "software" }, { text: "broker" }],
            [{ text: "username" }, { text: "password" }],
            [{ text: "status" }],
          ],
        },
      });
      return true;
    }
    return false;
  }

  selectUserAttribute() {
    if (this.session.nextStep === "select_user_attribute") {
      const userAttribute = this.text.trim();

      this.session.editUser = {
        ...this.session.editUser,
        attribute: userAttribute,
      };

      if (userAttribute === "name") {
        this.reply("نام جدید را وارد کنید", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } else if (userAttribute === "key") {
        this.reply("شناسه جدید را وارد کنید", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } else if (userAttribute === "username") {
        this.reply("نام کاربری جدید را وارد کنید", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } else if (userAttribute === "password") {
        this.reply("کلمه عبور جدید را وارد کنید", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } else if (userAttribute === "status") {
        this.reply("وضعیت مشتری را مشخص کنید", {
          reply_markup: {
            resize_keyboard: true,
            keyboard: [[{ text: "فعال" }, { text: "غیرفعال" }]],
          },
        });
      } else if (userAttribute === "software") {
        this.reply("با چه نرم افزاری سفارشات مشتری ثبت شود؟", {
          reply_markup: {
            resize_keyboard: true,
            keyboard: config.softwareList,
          },
        });
      } else if (userAttribute === "broker") {
        this.reply("کارگزاری مشتری را انتخاب کنید", {
          reply_markup: {
            resize_keyboard: true,
            keyboard: config.brokerList,
          },
        });
      }

      this.session.nextStep = "update_user_attribute";
      return true;
    }
    return false;
  }

  async updateUserAttribute() {
    if (this.session.nextStep === "update_user_attribute") {
      let attribute = this.session.editUser.attribute;
      let value = this.text.trim();

      if (attribute === "status") {
        attribute = "inactive";
        value = value === "غیرفعال" ? 1 : 0;
      }

      const user = await UserService.update(this.session.editUser.id, {
        [attribute]: value,
      });

      this.reply(`update customer ID: ${this.session.editUser.id}`, {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      this.session.nextStep = null;
      this.session.editUser = null;
      return true;
    }
    return false;
  }

  searchUser() {
    if (this.text === "/search_user") {
      this.session.nextStep = "user_search_result";

      this.reply(
        "نام کاربر را برای جستجو وارد کنید\nبرای جستجوی چند کاربر از خط تیره استفاده کنید",
        {
          reply_markup: {
            remove_keyboard: true,
          },
        }
      );

      return true;
    }
    return false;
  }

  async deleteOrderById() {
    const match = this.text.match(/^\/order_delete_(\d+)$/i);
    if (match) {
      const orderId = parseInt(match[1], 10);
      const order = await OrderService.findById(orderId);

      if (order.status !== "new") {
        throw new Error("Only delete order with new status");
      }

      await OrderService.delete(orderId);

      this.reply("delete complete", {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return true;
    }
    return false;
  }

  async runOrderById() {
    const match = this.text.match(/^\/run_order_(\d+)$/i);
    if (match) {
      const orderId = parseInt(match[1], 10);
      this.session.runOrderId = orderId;

      this.reply(`سرور سفارش گذاری را انتخاب کنید`, {
        reply_markup: {
          resize_keyboard: true,
          keyboard: config.serverChooseList.map((server) => [{ text: server }]),
        },
      });

      return true;
    }
    return false;
  }

  runOrderByServer() {
    if (this.session.runOrderId) {
      const server = this.text.trim().split("-");
      const orderId = this.session.runOrderId;

      request(
        {
          url: `http://${server[1].trim()}:4000/run?id=${orderId}`,
          method: "GET",
          timeout: 3000, // ms
        },
        (error, response, body) => {
          if (error) {
            this.reply(
              typeof error === "string" ? error : JSON.stringify(error),
              {
                reply_markup: {
                  remove_keyboard: true,
                },
              }
            );
            return false;
          }

          this.reply(body, {
            reply_markup: {
              remove_keyboard: true,
            },
          });
        }
      );

      this.session.runOrderId = null;
      return true;
    }
    return false;
  }

  async getOrderListForUser() {
    const match = this.text.match(/^\/order_list_(\d+)$/i);
    if (match) {
      const userId = parseInt(match[1]);
      const orderList = await OrderService.listByUserId(userId, 10);

      const orderData = orderList.map((order) => {
        return `#${order.id} - سفارش ${
          order.side === "buy" ? "خرید" : "فروش"
        }\n📈 نماد: ${order.isinName}\n💰 قیمت: ${currency(
          order.price
        )}\n🧮 تعداد سهم: ${digit(order.quantity) || "کل موجودی"}\n💻 سرور: ${
          order.server
        }\n⌚ ${order.startTime} - ${order.endTime} - ${
          order.delay
        } ms\nوضعیت: ${order.status}`;
      });

      this.reply(orderData.join("\n\n===========================\n\n"), {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return true;
    }
    return false;
  }

  async getOpenOrder() {
    const match = this.text.match(/^\/open_order_(\d+)$/i);
    if (match) {
      const userId = parseInt(match[1]);

      try {
        const result = await UserService.getUserOpenOrder(userId);
        this.reply(result.join("\n\n===========================\n\n"), {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  async getTodayOrder() {
    const match = this.text.match(/^\/today_order_(\d+)$/i);
    if (match) {
      const userId = parseInt(match[1]);

      try {
        const result = await UserService.getUserTodayOrder(userId);
        this.reply(result.join("\n\n===========================\n\n"), {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  async getPortfolio() {
    const match = this.text.match(/^\/portfolio_(\d+)$/i);
    if (match) {
      const userId = parseInt(match[1]);

      try {
        const result = await UserService.getPortfolio(userId);
        this.reply(
          result.map((r) => r.text).join("\n\n===========================\n\n"),
          {
            reply_markup: {
              remove_keyboard: true,
            },
          }
        );
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  async getGroupPortfolio() {
    if (this.text === "/group_portfolio") {
      try {
        const userIds = this.session.newOrder.userIds;

        let list = [];
        for (let i = 0; i < userIds.length; i++) {
          const userId = userIds[i];

          try {
            const result = await UserService.getPortfolio(userId);
            result.forEach((r) => {
              list.push(r);
            });
          } catch (err) {
            console.log(err);
            continue;
          }
        }

        let symbolList = {};
        list.forEach((item) => {
          if (!symbolList[item.symbol.isinName])
            symbolList[item.symbol.isinName] = [];
          symbolList[item.symbol.isinName].push(item);
        });

        let finalList = [];
        Object.keys(symbolList).forEach((isinName) => {
          finalList.push(
            `#${isinName}\n${symbolList[isinName]
              .map(
                (v) =>
                  `📌 ${v.user.name}\n💵 ${currencyAlpha(
                    roundCurrency(v.symbol.totalPrice)
                  )}\n📐 سود/ضرر با قیمت پایانی: ${
                    v.symbol.finalPricePercent
                  }%\n📏 سود/ضرر با آخرین قیمت: ${
                    v.symbol.lastTradePricePercent
                  }%\n💎 تعداد: ${digit(v.symbol.quantity)}`
              )
              .join(`\n\n`)}`
          );
        });

        finalList.forEach((message) => {
          this.reply(message, {
            reply_markup: {
              remove_keyboard: true,
            },
          });
        });

        // let messages = [finalList.join("\n\n=========================\n\n")];
        // if (messages[0].length > 3500) {
        //   console.log("messages[0].length", messages[0].length);
        //   const countMessage = Math.ceil(messages[0].length / 3500);
        //   const countResultPerMessage = Math.floor(
        //     finalList.length / countMessage
        //   );
        //   console.log("countMessage", countMessage);
        //   console.log("countResultPerMessage", countResultPerMessage);

        //   messages = [];
        //   for (let i = 0; i <= finalList.length; i += countResultPerMessage) {
        //     console.log(
        //       i,
        //       i + countResultPerMessage > finalList.length
        //         ? finalList.length
        //         : i + countResultPerMessage
        //     );
        //     messages.push(
        //       finalList
        //         .slice(
        //           i,
        //           i + countResultPerMessage > finalList.length
        //             ? finalList.length
        //             : i + countResultPerMessage
        //         )
        //         .join("\n\n=========================\n\n")
        //     );
        //   }
        // }

        // messages.forEach((message) => {
        //   this.reply(message, {
        //     reply_markup: {
        //       remove_keyboard: true,
        //     },
        //   });
        // });
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  async getCreditUser() {
    const match = this.text.match(/^\/credit_user_(\d+)$/i);
    if (match) {
      const userId = parseInt(match[1]);

      try {
        const result = await UserService.getUserCredit(userId);
        this.reply(result, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  async getGroupCredit() {
    if (this.text === "/group_credit") {
      try {
        const userIds = this.session.newOrder.userIds;

        let list = [];
        for (let i = 0; i < userIds.length; i++) {
          const userId = userIds[i];

          try {
            const result = await UserService.getUserCredit(userId);
            list.push(result);
          } catch (err) {
            console.log(err);
            continue;
          }
        }

        this.reply(list.join("\n\n---------------------\n\n"), {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  async getGroupOpenOrder() {
    if (this.text === "/group_open_order") {
      try {
        const userIds = this.session.newOrder.userIds;

        let list = [];
        for (let i = 0; i < userIds.length; i++) {
          const userId = userIds[i];

          try {
            const result = await UserService.getUserOpenOrder(userId);
            this.reply(result.join("\n\n===========================\n\n"), {
              reply_markup: {
                remove_keyboard: true,
              },
            });
          } catch (e) {
            this.reply(e, {
              reply_markup: {
                remove_keyboard: true,
              },
            });
          }
        }
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  async cancelOrder() {
    const match = this.text.match(/^\/cancel_order_(\d+)_(\w+)$/i);
    if (match) {
      const userId = parseInt(match[1]);
      const orderId = parseInt(match[2]);

      try {
        const result = await UserService.cancelOrder(userId, orderId);
        this.reply(result, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      } catch (e) {
        this.reply(e, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  addUser() {
    if (this.text === "/add_user") {
      this.session.nextStep = "enter_user_key";
      this.reply("شناسه مشتری جدید را وارد کنید", {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return true;
    }
    return false;
  }

  async getUserListData(page = 1, limit = 5) {
    let userList = await UserService.list();

    let options = {};
    const inlineKeyboard = paginationInlineKeyboard(
      userList.length,
      limit,
      "user_list_page_",
      page
    );
    if (inlineKeyboard !== null) {
      options.reply_markup = { inline_keyboard: inlineKeyboard };
    } else {
      options.reply_markup = { remove_keyboard: true };
    }

    userList = paginationFilterList(userList, page, limit);

    const userData = userList.map((user) => {
      return `#${user.id} - ${user.key}\n${user.inactive === 1 ? "☠️" : "👨🏻"} ${
        user.name
      }\n💻 ${user.software} [${user.broker}]\n🔑 ${
        user.tokenUpdatedAt || "00-00-00 00:00:00"
      }\n/user_edit_${user.id} - /info_user_${user.id}\n/order_add_${
        user.id
      } - /order_list_${user.id}\n/open_order_${user.id} - /today_order_${
        user.id
      } - /portfolio_${user.id} - /credit_user_${user.id}\n🔐 /login_user_${
        user.id
      }`;
    });

    return {
      list: userData.join("\n\n===========================\n\n"),
      options,
    };
  }

  async getUserList() {
    if (this.text === "/user_list") {
      const { list, options } = await this.getUserListData();
      this.reply(list, options);
      return true;
    }
    return false;
  }

  async getUserListPage(ctx) {
    const callbackQuery = ctx.update.callback_query;
    const data = callbackQuery.data;

    const match = data.match(/^user_list_page_(\d+)$/i);
    if (match) {
      const page = parseInt(match[1]);

      const { list, options } = await this.getUserListData(page);

      ctx.editMessageText(list, options);
      ctx.answerCbQuery();
      return true;
    }
    return false;
  }

  async getOrderListData(page = 1, limit = 5) {
    let orderNewList = await OrderService.listByStatus("new");

    let options = {};
    const inlineKeyboard = paginationInlineKeyboard(
      orderNewList.length,
      limit,
      "order_list_page_",
      page
    );
    if (inlineKeyboard !== null) {
      options.reply_markup = { inline_keyboard: inlineKeyboard };
    } else {
      options.reply_markup = { remove_keyboard: true };
    }

    orderNewList = paginationFilterList(orderNewList, page, limit);

    const orderNewData = orderNewList.map((order) => {
      return `#${order.id} - سفارش ${
        order.side === "buy" ? "خرید" : "فروش"
      }\n👨🏻 ${order.user.name}\n🆔 ${order.user.key}\n📈 نماد: ${
        order.isinName
      }\n💰 قیمت: ${currency(order.price)}\n🧮 تعداد سهم: ${
        digit(order.quantity) || "کل موجودی"
      }\n💻 سرور: ${order.server}\n⌚ ${order.startTime} - ${order.endTime} - ${
        order.delay
      } ms\n🗑 /order_delete_${order.id}\n💴 /credit_user_${
        order.user.id
      }\n🔐 /login_user_${order.user.id}\n🧨 /run_order_${order.id}`;
    });
    return {
      list: orderNewData.join("\n\n===========================\n\n"),
      options,
    };
  }

  async getOrderList() {
    if (this.text === "/order_list") {
      const { list, options } = await this.getOrderListData();
      this.reply(list, options);
      return true;
    }
    return false;
  }

  async deleteOrderList() {
    if (this.text === "/order_list_delete") {
      let orderNewList = await OrderService.listByStatus("new");

      for (let i = 0; i < orderNewList.length; i++) {
        await OrderService.delete(orderNewList[i].id);
      }

      this.reply("همه حذف شدند", { reply_markup: { remove_keyboard: true } });
      return true;
    }
    return false;
  }

  async getOrderListPage(ctx) {
    const callbackQuery = ctx.update.callback_query;
    const data = callbackQuery.data;

    const match = data.match(/^order_list_page_(\d+)$/i);
    if (match) {
      const page = parseInt(match[1]);

      const { list, options } = await this.getOrderListData(page);

      ctx.editMessageText(list, options);
      ctx.answerCbQuery();
      return true;
    }
    return false;
  }

  async getUserForOrderListData(page = 1, limit = 5) {
    let userList = await UserService.listForOrder();

    let options = {};
    const inlineKeyboard = paginationInlineKeyboard(
      userList.length,
      limit,
      "user_for_order_page_",
      page
    );
    if (inlineKeyboard !== null) {
      options.reply_markup = { inline_keyboard: inlineKeyboard };
    } else {
      options.reply_markup = { remove_keyboard: true };
    }

    userList = paginationFilterList(userList, page, limit);

    const userData = userList.map((user) => {
      return `#${user.id} - ${user.key}\n👨🏻 ${user.name}\n/order_add_${user.id}\n💻 ${user.software} [${user.broker}]\n/order_fast_add_${user.id}`;
    });
    return {
      list: userData.join("\n\n"),
      options,
    };
  }

  async getUserForOrderList() {
    if (this.text === "/user_for_order") {
      const { list, options } = await this.getUserForOrderListData();
      this.reply(list, options);
      return true;
    }
    return false;
  }

  async getUserForOrderListPage(ctx) {
    const callbackQuery = ctx.update.callback_query;
    const data = callbackQuery.data;

    const match = data.match(/^user_for_order_page_(\d+)$/i);
    if (match) {
      const page = parseInt(match[1]);

      const { list, options } = await this.getUserForOrderListData(page);

      ctx.editMessageText(list, options);
      ctx.answerCbQuery();
      return true;
    }
    return false;
  }

  enterUserKey() {
    if (this.session.nextStep === "enter_user_key") {
      this.session.newUser = {
        key: this.text.trim(),
      };
      this.reply("نام و نام خانوادگی مشتری را وارد کنید", {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      this.session.nextStep = "enter_user_name";
      return true;
    }
    return false;
  }

  enterUserName() {
    if (this.session.nextStep === "enter_user_name") {
      this.session.newUser = {
        ...this.session.newUser,
        name: this.text.trim(),
      };
      this.reply("با چه نرم افزاری سفارشات مشتری ثبت شود؟", {
        reply_markup: {
          resize_keyboard: true,
          keyboard: config.softwareList,
        },
      });
      this.session.nextStep = "enter_user_software";
      return true;
    }
    return false;
  }

  enterUserSoftware() {
    if (this.session.nextStep === "enter_user_software") {
      this.session.newUser = {
        ...this.session.newUser,
        software: this.text.trim(),
      };
      this.reply("کارگزاری مشتری را انتخاب کنید", {
        reply_markup: {
          resize_keyboard: true,
          keyboard: config.brokerList,
        },
      });
      this.session.nextStep = "enter_user_broker";
      return true;
    }
    return false;
  }

  enterUserBroker() {
    if (this.session.nextStep === "enter_user_broker") {
      this.session.newUser = {
        ...this.session.newUser,
        broker: this.text.trim(),
      };
      this.reply("نام کاربری حساب مشتری را وارد کنید", {
        reply_markup: {
          resize_keyboard: true,
          keyboard: [[{ text: this.session.newUser.key }]],
        },
      });
      this.session.nextStep = "enter_user_username";
      return true;
    }
    return false;
  }

  enterUserUsername() {
    if (this.session.nextStep === "enter_user_username") {
      this.session.newUser = {
        ...this.session.newUser,
        username: this.text.trim(),
      };
      this.reply("کلمه عبور حساب مشتری را وارد کنید", {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      this.session.nextStep = "enter_user_password";
      return true;
    }
    return false;
  }

  async enterUserPassword() {
    if (this.session.nextStep === "enter_user_password") {
      this.session.newUser = {
        ...this.session.newUser,
        password: this.text.trim(),
        inactive: 0,
      };
      const user = await UserService.add(this.session.newUser);
      this.reply(
        `✅ مشتری جدید اضافه شد\n\n#${user.id} - ${user.key}\n${
          user.inactive === 1 ? "☠️" : "👨🏻"
        } ${user.name}\n💻 ${user.software} [${user.broker}]\n🔑 ${
          user.tokenUpdatedAt || "00-00-00 00:00:00"
        }\n/user_edit_${user.id} - /info_user_${user.id}\n/order_add_${
          user.id
        } - /order_list_${user.id}\n/open_order_${user.id} - /today_order_${
          user.id
        } - /portfolio_${user.id} - /credit_user_${user.id}\n🔐 /login_user_${
          user.id
        }`,
        {
          reply_markup: {
            remove_keyboard: true,
          },
        }
      );

      this.session.nextStep = null;
      this.session.newUser = null;
      return true;
    }
    return false;
  }

  async userSearchResult() {
    if (this.session.nextStep === "user_search_result") {
      try {
        const names = this.text.trim().split("-");

        let notFoundList = [];
        let list = [];
        let forGroupOrder = [];
        for (let i = 0; i < names.length; i++) {
          const searchName = names[i].trim();
          if (!searchName) continue;

          const [name, broker] = searchName.split(":");

          const user = await UserService.searchByName(name, broker);
          if (!user) {
            notFoundList.push(searchName);
            continue;
          }

          if (forGroupOrder.find((id) => id === user.id)) continue;

          forGroupOrder.push(user.id);
          list.push(
            `#${user.id} - ${user.key}\n${user.inactive === 1 ? "☠️" : "👨🏻"} ${
              user.name
            }\n💻 ${user.software} [${user.broker}]\n/user_edit_${
              user.id
            } - /info_user_${user.id}\n/order_add_${user.id} - /order_list_${
              user.id
            }\n/open_order_${user.id} - /today_order_${user.id} - /portfolio_${
              user.id
            } - /credit_user_${user.id}\n🔐 /login_user_${user.id}`
          );
        }

        if (forGroupOrder.length > 0) {
          this.session.newOrder = {
            userIds: forGroupOrder,
          };
        }

        if (list.length > 0) {
          this.reply(
            `${list.join(
              "\n\n===========================\n\n"
            )}\n\n===========================\n\n/group_login\n\n/group_order\n/group_fast_order\n/group_credit\n/group_portfolio\n/group_open_order${
              notFoundList.length > 0
                ? `\n\n🚷 یافت نشده ها\n\n${notFoundList.join("\n")}`
                : ""
            }`,
            {
              reply_markup: {
                remove_keyboard: true,
              },
            }
          );
        } else {
          this.reply(`🚷 یافت نشده ها\n\n${notFoundList.join("\n")}`, {
            reply_markup: {
              remove_keyboard: true,
            },
          });
        }
      } catch (err) {
        this.reply(err, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      this.session.nextStep = null;
      return true;
    }
    return false;
  }

  async addOrder() {
    const matchById = this.text.match(/^\/order_add_(\d+)$/i);
    const matchFastById = this.text.match(/^\/order_fast_add_(\d+)$/i);
    const isGroup = this.text === "/group_order";
    const isFastGroup = this.text === "/group_fast_order";

    if (matchById || isGroup || matchFastById || isFastGroup) {
      if (matchById || matchFastById) {
        this.session.newOrder = {
          userIds: [parseInt(matchById[1], 10)],
        };
      }

      if (matchFastById || isFastGroup) {
        this.session.fastOrderMode = true;
      } else {
        this.session.fastOrderMode = false;
      }

      this.session.nextStep = "enter_order_isin_search";

      const symbolsList = await OrderService.lastSymbols(
        "isinName",
        10,
        "isin"
      );

      this.reply("نام نماد را برای جستجو وارد کنید", {
        reply_markup: {
          resize_keyboard: true,
          keyboard: symbolsList.map((symbol) => [{ text: symbol }]),
        },
      });

      return true;
    }
    return false;
  }

  async enterOrderIsinSearch() {
    if (this.session.nextStep === "enter_order_isin_search") {
      try {
        const [isinName, isin] = this.text.split("-");

        let query = isinName.trim();
        if (isin) {
          query = isin.trim();
        }

        const searchResult = await TadbirApi.search(query, true);
        this.session.searchStock = searchResult;

        this.session.nextStep = "enter_order_isin";

        if (searchResult.length === 1 && isin) {
          await this.reply(`نماد ${searchResult[0].name} تنظیم شد`, {
            reply_markup: {
              remove_keyboard: true,
            },
          });

          this.enterOrderIsin();
        } else {
          this.reply(`نماد مورد نظر خود را از پایین انتخاب کنید`, {
            reply_markup: {
              resize_keyboard: true,
              keyboard: searchResult.map((stock) => [
                { text: `${stock.name} - ${stock.isin}` },
              ]),
            },
          });
        }
      } catch (err) {
        if (this.text.trim().substring(0, 2) === "IR") {
          this.session.searchStock = null;
          this.reply(`نماد مورد نظر خود را از پایین انتخاب کنید`, {
            reply_markup: {
              resize_keyboard: true,
              keyboard: [[{ text: `نامشخص - ${this.text.trim()}` }]],
            },
          });
          this.session.nextStep = "enter_order_isin";
        } else {
          this.reply(err);
        }
      }

      return true;
    }
    return false;
  }

  enterOrderIsin() {
    if (this.session.nextStep === "enter_order_isin") {
      const [isinName, isin] = this.text.split("-");
      this.session.newOrder = {
        ...this.session.newOrder,
        isin: isin.trim(),
        isinName: isinName.trim(),
      };

      this.reply(`سفارش خرید یا فروش`, {
        reply_markup: {
          resize_keyboard: true,
          keyboard: [[{ text: "buy" }, { text: "sell" }]],
        },
      });
      this.session.nextStep = "enter_order_side";
      return true;
    }
    return false;
  }

  enterOrderSide() {
    if (this.session.nextStep === "enter_order_side") {
      const orderSide = this.text.trim();
      this.session.newOrder = {
        ...this.session.newOrder,
        side: orderSide,
      };

      let reply_markup = {};
      if (this.session.searchStock) {
        // const foundStock = this.session.searchStock.find(
        //   (stock) => stock.isin === this.session.newOrder.isin
        // );
        // const { priceHigh, priceLow } = calculatePrice(
        //   foundStock.closingPrice,
        //   5,
        //   this.session.newOrder.isin
        // );
        // const newPriceHigh = calculatePrice(
        //   priceHigh,
        //   5,
        //   this.session.newOrder.isin
        // );
        // const newPriceLow = calculatePrice(
        //   priceLow,
        //   5,
        //   this.session.newOrder.isin
        // );
        reply_markup.keyboard = [
          // [{ text: orderSide === "buy" ? priceHigh : priceLow }],
          [{ text: "محاسبه خودکار قیمت سهم" }],
          // [
          //   {
          //     text:
          //       orderSide === "buy"
          //         ? newPriceHigh.priceHigh
          //         : newPriceLow.priceLow,
          //   },
          // ],
        ];
        reply_markup.resize_keyboard = true;
      } else {
        reply_markup.remove_keyboard = true;
      }

      this.reply(
        `قیمت ${
          orderSide === "buy" ? "خرید" : "فروش"
        } فردا را از پایین انتخاب کنید و یا اگر قیمت دیگری است آن را به ریال وارد کنید`,
        {
          reply_markup,
        }
      );
      this.session.nextStep = "enter_order_price";
      return true;
    }
    return false;
  }

  enterOrderPrice() {
    if (this.session.nextStep === "enter_order_price") {
      this.session.newOrder = {
        ...this.session.newOrder,
        price:
          this.text === "محاسبه خودکار قیمت سهم"
            ? 0
            : parseInt(this.text.trim(), 10),
      };

      this.reply(
        `تعداد سهم برای ${
          this.session.newOrder.side === "buy" ? "خرید" : "فروش"
        } فردا چه تعداد است؟\nبرای سفارش سرعتی میتوانید درصدی از تعداد سهام‌های خود را بفروشید و یا درصدی از نقدینگی خود را خرید بزنید، برای مثال بزنید 20%`,
        {
          reply_markup: {
            resize_keyboard: true,
            keyboard: [[{ text: "محاسبه خودکار تعداد سهم" }]],
          },
        }
      );
      this.session.nextStep = "enter_order_quantity";
      return true;
    }
    return false;
  }

  async enterOrderQuantity() {
    if (this.session.nextStep === "enter_order_quantity") {
      this.session.newOrder = {
        ...this.session.newOrder,
        quantity:
          this.text === "محاسبه خودکار تعداد سهم" ? 0 : this.text.trim(),
        server: config.serverList[0],
      };

      if (this.session.fastOrderMode) {
        this.reply(`سفارش سرعتی را تایید میکنید؟`, {
          reply_markup: {
            resize_keyboard: true,
            keyboard: [[{ text: "YES" }, { text: "NO" }]],
          },
        });
        this.session.nextStep = "fast_order_confirm";
        return true;
      }

      // TODO:
      const symbolsList = await OrderService.lastSymbols("startTime", 10);
      this.reply(
        `سفارش فردا از چه تایمی شروع شود، انتخاب کنید یا به فرمت HH:mm:ss تایپ کنید`,
        {
          reply_markup: {
            resize_keyboard: true,
            keyboard: symbolsList.map((symbol) => [{ text: symbol }]),
          },
        }
      );
      this.session.nextStep = "enter_order_startTime";

      // this.reply(`سرور سفارش گذاری را انتخاب کنید`, {
      //   reply_markup: {
      //     resize_keyboard: true,
      //     keyboard: config.serverList.map(server => [{ text: server }]),
      //   },
      // });
      // this.session.nextStep = "enter_order_server";
      return true;
    }
    return false;
  }

  async enterOrderServer() {
    if (this.session.nextStep === "enter_order_server") {
      this.session.newOrder = {
        ...this.session.newOrder,
        server: this.text.trim(),
      };

      const symbolsList = await OrderService.lastSymbols("startTime", 10);

      this.reply(
        `سفارش فردا از چه تایمی شروع شود، انتخاب کنید یا به فرمت HH:mm:ss تایپ کنید`,
        {
          reply_markup: {
            resize_keyboard: true,
            keyboard: symbolsList.map((symbol) => [{ text: symbol }]),
          },
        }
      );
      this.session.nextStep = "enter_order_startTime";
      return true;
    }
    return false;
  }

  async enterOrderStartTime() {
    if (this.session.nextStep === "enter_order_startTime") {
      this.session.newOrder = {
        ...this.session.newOrder,
        startTime: this.text.trim(),
      };

      const symbolsList = await OrderService.lastSymbols("endTime", 10);

      this.reply(
        `سفارش فردا در چه تایمی تمام شود، انتخاب کنید یا به فرمت HH:mm:ss تایپ کنید`,
        {
          reply_markup: {
            resize_keyboard: true,
            keyboard: symbolsList.map((symbol) => [{ text: symbol }]),
          },
        }
      );
      this.session.nextStep = "enter_order_endTime";
      return true;
    }
    return false;
  }

  async enterOrderEndTime() {
    if (this.session.nextStep === "enter_order_endTime") {
      const startTime = this.session.newOrder.startTime;
      const endTime = this.text.trim();

      if (moment(endTime, "HH:mm:ss").isBefore(moment(startTime, "HH:mm:ss"))) {
        this.reply(`زمان پایانی قبل از زمان شروع سفارش است`);
        return false;
      }

      this.session.newOrder = {
        ...this.session.newOrder,
        endTime: endTime,
      };

      const symbolsList = await OrderService.lastSymbols("delay", 10);

      this.reply(
        this.session.newOrder.userIds.length > 1
          ? "رنج فاصله زمانی بین ارسال سفارش چند میلی ثانیه باشد؟\nبا خط تیره شروع و پایان زمان را مشخص کنید"
          : "فاصله زمانی بین هر ارسال سفارش چند میلی ثانیه باشد؟",
        {
          reply_markup: {
            resize_keyboard: true,
            keyboard: symbolsList.map((symbol) => [{ text: symbol }]),
          },
        }
      );

      this.session.nextStep = "enter_order_delay";
      return true;
    }
    return false;
  }

  async enterOrderDelayAndCreate() {
    if (this.session.nextStep === "enter_order_delay") {
      const [start, end] = this.text.split("-");

      let delay = parseInt(start.trim(), 10);

      let result = [];
      for (let i = 0; i < this.session.newOrder.userIds.length; i++) {
        if (end) {
          delay =
            Math.floor(
              Math.random() *
                (parseInt(end.trim(), 10) - parseInt(start.trim(), 10))
            ) + parseInt(start.trim(), 10);
        }

        const order = await OrderService.add({
          ...this.session.newOrder,
          userId: this.session.newOrder.userIds[i],
          quantity: parseInt(this.session.newOrder.quantity, 10),
          delay,
        });

        result.push(
          `#${order.id} - سفارش ${order.side === "buy" ? "خرید" : "فروش"}\n👨🏻 ${
            order.user.name
          }\n🆔 ${order.user.key}\n📈 نماد: ${
            order.isinName
          }\n💰 قیمت: ${currency(order.price)}\n🧮 تعداد سهم: ${
            digit(order.quantity) || "کل موجودی"
          }\n💻 سرور: ${order.server}\n⌚ ${order.startTime} - ${
            order.endTime
          } - ${order.delay} ms\n🗑 /order_delete_${order.id}\n💴 /credit_user_${
            order.user.id
          }\n🔐 /login_user_${order.user.id}\n🧨 /run_order_${order.id}`
        );
      }

      this.reply(result.join("\n\n===========================\n\n"), {
        reply_markup: {
          remove_keyboard: true,
        },
      });

      this.session.nextStep = null;
      return true;
    }
    return false;
  }

  async fastOrderConfirmAndCreate() {
    if (this.session.nextStep === "fast_order_confirm") {
      if (this.text.trim() === "NO") {
        this.reply("سفارش سرعتی کنسل شد", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
        this.session.nextStep = null;
        return true;
      }

      let quantity = parseInt(this.session.newOrder.quantity, 10);
      let percentQuantity = null;
      if (this.session.newOrder.quantity.toString().indexOf("%") !== -1) {
        quantity = 0;
        percentQuantity = parseInt(
          this.session.newOrder.quantity.replace("%", ""),
          10
        );
      }

      this.reply("سفارشات شما تنظیم شد", {
        reply_markup: {
          remove_keyboard: true,
        },
      });

      for (let i = 0; i < this.session.newOrder.userIds.length; i++) {
        const order = await OrderService.add({
          ...this.session.newOrder,
          userId: this.session.newOrder.userIds[i],
          quantity,
          delay: 1,
          startTime: "08:00:00",
          endTime: "16:00:00",
        });

        OrderService.sendFastOrder(order, percentQuantity)
          .then(async () => {
            const orderUpdated = await OrderService.findById(order.id);

            this.reply(
              `〽 #${orderUpdated.id} - سفارش ${
                orderUpdated.side === "buy" ? "خرید" : "فروش"
              } سرعتی\n👨🏻 ${orderUpdated.user.name}\n🆔 ${
                orderUpdated.user.key
              }\n📈 نماد: ${orderUpdated.isinName}\n💰 قیمت: ${currency(
                orderUpdated.price
              )}\n🧮 تعداد سهم: ${
                digit(orderUpdated.quantity) || "کل موجودی"
              }\n\n${
                orderUpdated.status === "failed"
                  ? `❌ وضعیت: failed`
                  : `جایگاه: ${orderUpdated.position}\nوضعیت: ${orderUpdated.statusText}`
              }`,
              {
                reply_markup: {
                  remove_keyboard: true,
                },
              }
            );
          })
          .catch(async (e) => {
            const orderUpdated = await OrderService.findById(order.id);

            this.reply(
              `〽 #${orderUpdated.id} - سفارش ${
                orderUpdated.side === "buy" ? "خرید" : "فروش"
              } سرعتی\n👨🏻 ${orderUpdated.user.name}\n🆔 ${
                orderUpdated.user.key
              }\n📈 نماد: ${orderUpdated.isinName}\n💰 قیمت: ${currency(
                orderUpdated.price
              )}\n🧮 تعداد سهم: ${
                digit(orderUpdated.quantity) || "کل موجودی"
              }\n\n❗ ${e.toString()}`
            );
          });

        await delay(3000);
      }

      this.session.nextStep = null;
      return true;
    }
    return false;
  }

  async deleteAnalyzerById() {
    const match = this.text.match(/^\/analyzer_delete_(\d+)$/i);
    if (match) {
      const analyzerId = parseInt(match[1], 10);

      await AnalyzerService.delete(analyzerId);

      this.reply("delete complete", {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return true;
    }
    return false;
  }

  addAnalyzer() {
    if (this.text === "/add_analyzer") {
      this.session.nextStep = "enter_analyzer_isin_search";
      this.reply("نام نماد را برای جستجو وارد کنید", {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return true;
    }
    return false;
  }

  async enterAnalyzerIsinSearch() {
    if (this.session.nextStep === "enter_analyzer_isin_search") {
      try {
        const searchResult = await TadbirApi.search(this.text.trim(), true);
        this.session.searchStock = searchResult;

        this.reply(`نماد مورد نظر خود را از پایین انتخاب کنید`, {
          reply_markup: {
            resize_keyboard: true,
            keyboard: searchResult.map((stock) => [
              { text: `${stock.name} - ${stock.isin}` },
            ]),
          },
        });
        this.session.nextStep = "enter_analyzer_isin";
      } catch (err) {
        this.reply(err);
      }

      return true;
    }
    return false;
  }

  async enterAnalyzerIsinAndCreate() {
    if (this.session.nextStep === "enter_analyzer_isin") {
      const [isinName, isin] = this.text.split("-");

      const foundStock = this.session.searchStock.find(
        (stock) => stock.isin === isin.trim()
      );

      if (foundStock) {
        const analyzer = await AnalyzerService.add({
          isin: isin.trim(),
          isinName: isinName.trim(),
          insCode: foundStock.insCode,
        });
        this.reply(`نماد جدید اضافه شد\n${JSON.stringify(analyzer)}`, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
        this.session.nextStep = null;
      } else {
        this.reply("insCode not found", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      }

      return true;
    }
    return false;
  }

  async getAnalyzerList() {
    if (this.text === "/analyzer_list") {
      const analyzerList = await AnalyzerService.list();

      const analyzerData = analyzerList.map((analyzer) => {
        return `#${analyzer.id} - ${analyzer.isin}\n${analyzer.isinName}\n${
          analyzer.lastAlertAt || "00-00-00 00:00:00"
        }\n/analyzer_delete_${analyzer.id}`;
      });

      this.reply(analyzerData.join("\n\n"), {
        reply_markup: {
          remove_keyboard: true,
        },
      });
      return true;
    }
    return false;
  }

  async getCreditOrder() {
    if (this.text === "/credit_order") {
      try {
        let { result, sum, orderCount, failedLoginList } =
          await OrderService.getCredit();

        if (result.length === 0) {
          this.reply("موردی یافت نشد", {
            reply_markup: {
              remove_keyboard: true,
            },
          });
          return true;
        }

        let messages = [result.join("\n\n")];
        if (messages[0].length > 4096) {
          messages = [
            result.slice(0, Math.ceil(result.length / 2)).join("\n\n"),
            result.slice(Math.ceil(result.length / 2)).join("\n\n"),
          ];
        }

        messages.forEach((message) => {
          this.reply(message, {
            reply_markup: {
              remove_keyboard: true,
            },
          });
        });

        this.session.newOrder = {
          userIds: failedLoginList,
        };

        this.reply(
          `تعداد سفارش: ${orderCount} \n جمع موجودی:‌ ${currency(sum)}${
            failedLoginList.length > 0 ? `\n🔐 /group_login` : ""
          }`,
          {
            reply_markup: {
              remove_keyboard: true,
            },
          }
        );
        return true;
      } catch (e) {
        this.reply("موردی یافت نشد", {
          reply_markup: {
            remove_keyboard: true,
          },
        });
        return true;
      }
    }
    return false;
  }

  async getCreditUsersActive() {
    if (this.text === "/credit_user") {
      let result = await UserService.getCreditUsersActive();
      if (result.length === 0) result = "موردی یافت نشد";

      let messages = [result.join("\n\n")];
      if (messages[0].length > 4096) {
        messages = [
          result.slice(0, Math.ceil(result.length / 2)).join("\n\n"),
          result.slice(Math.ceil(result.length / 2)).join("\n\n"),
        ];
      }

      messages.forEach((message) => {
        this.reply(message, {
          reply_markup: {
            remove_keyboard: true,
          },
        });
      });

      return true;
    }
    return false;
  }

  async loginUsersActiveFunc(reply) {
    let result = await UserService.loginUsersActive(reply);
    if (result.length === 0) result = "موردی یافت نشد";

    let messages = [result.join("\n\n")];
    if (messages[0].length > 4096) {
      messages = [
        result.slice(0, Math.ceil(result.length / 2)).join("\n\n"),
        result.slice(Math.ceil(result.length / 2)).join("\n\n"),
      ];
    }

    messages.forEach((message) => {
      reply(message, {
        reply_markup: {
          remove_keyboard: true,
        },
      });
    });
  }

  async loginUsersActiveAuto() {
    await this.loginUsersActiveFunc(this.replyToAdmin);
  }

  async loginUsersActive() {
    if (this.text === "/login_user") {
      await this.loginUsersActiveFunc(this.reply);
      return true;
    }
    return false;
  }
}

module.exports = BotService;
