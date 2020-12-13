const redisClient = require("redis").createClient();
const nohm = require("nohm").Nohm;
const schedule = require("node-schedule");

const BotService = require("./services/BotService");
const ApiService = require("./services/ApiService");
const OrderService = require("./services/OrderService");

redisClient.on("connect", async () => {
  redisClient.select(2);
  nohm.setClient(redisClient);

  const botService = new BotService();

  const apiService = new ApiService(botService, 3000);

  try {
    // GET 127.0.0.1:3000/orders[?server=iran_127.99.123.12&status=new]
    apiService.getOrderList();

    // GET 127.0.0.1:3000/order?id=1
    apiService.getOrderById();

    // POST 127.0.0.1:3000/order
    apiService.updateOrderById();

    // PUT 127.0.0.1:3000/user/token
    apiService.updateUserTokenByKey();

    // run api
    apiService.listen(3000);

    // cron job check credit users, 08:00:00
    schedule.scheduleJob("0 0 8 * * *", async () => {
      try {
        await OrderService.checkCredit(botService);
      } catch (e) {
        console.log("Check credit", e);
      }
    });

    // cron job get status orders, 12:32:00
    schedule.scheduleJob("0 32 12 * * *", async () => {
      try {
        await OrderService.getRunAndSetStatus(botService);
      } catch (e) {
        console.log("Get run and set status", e);
      }
    });

    // cron job get status orders, 07:00:00
    schedule.scheduleJob("0 0 7 * * *", async () => {
      try {
        await botService.loginUsersActiveAuto();
      } catch (e) {
        console.log("login users", e);
      }
    });

    // // cron job get status orders, 13:25:00
    // schedule.scheduleJob("0 25 13 * * *", async () => {
    //   try {
    //     await OrderService.getRunAndSetStatus(botService);
    //   } catch (e) {
    //     console.log("Get run and set status", e);
    //   }
    // });
  } catch (e) {
    console.log(e);
  }

  // telegram bot
  botService.bot.on("message", async (ctx) => {
    try {
      botService.setContext(ctx);

      // text == /user_edit_(\d+)
      if (botService.editUserById()) return;

      // text == /info_user_(\d+)
      if (await botService.infoUserById()) return;

      // text == /login_user_(\d+)
      if (await botService.loginUserById()) return;

      // text == /add_order_(\d+)
      // text == /add_fast_order_(\d+)
      // text == /group_order
      // text == /group_fast_order
      if (await botService.addOrder()) return;

      // text == /group_credit
      if (await botService.getGroupCredit()) return;

      // text == /group_open_order
      if (await botService.getGroupOpenOrder()) return;

      // text == /group_portfolio
      if (await botService.getGroupPortfolio()) return;

      // text == /group_login
      if (await botService.groupLoginUser()) return;

      // text == /order_list_(\d+)
      if (await botService.getOrderListForUser()) return;

      // text == /order_delete_(\d+)
      if (await botService.deleteOrderById()) return;

      // text == /run_order_(\d+)
      if (await botService.runOrderById()) return;

      // text == /analyzer_delete_(\d+)
      if (await botService.deleteAnalyzerById()) return;

      // text == /open_order_(\d+)
      if (await botService.getOpenOrder()) return;

      // text == /today_order_(\d+)
      if (await botService.getTodayOrder()) return;

      // text == /portfolio_(\d+)
      if (await botService.getPortfolio()) return;

      // text == /credit_user(\d+)
      if (await botService.getCreditUser()) return;

      // text == /cancel_order_(\d+)_(\w+)
      if (await botService.cancelOrder()) return;

      // text == /add_user
      if (botService.addUser()) return;

      // text == /add_analyzer
      if (botService.addAnalyzer()) return;

      // text == /user_list
      if (await botService.getUserList()) return;

      // text == /order_list
      if (await botService.getOrderList()) return;

      // text == /order_list_delete
      if (await botService.deleteOrderList()) return;

      // text == /user_for_order
      if (await botService.getUserForOrderList()) return;

      // text == /analyzer_list
      if (await botService.getAnalyzerList()) return;

      // text === /credit_order
      if (await botService.getCreditOrder()) return;

      // text === /credit_user
      if (await botService.getCreditUsersActive()) return;

      // text === /login_user
      if (await botService.loginUsersActive()) return;

      // text == /search_user
      if (botService.searchUser()) return;

      // session.runOrderId is exist
      if (botService.runOrderByServer()) return;

      // session.nextStep = select_user_attribute
      if (botService.selectUserAttribute()) return;

      // session.nextStep = update_user_attribute
      if (await botService.updateUserAttribute()) return;

      // session.nextStep = enter_user_key
      if (botService.enterUserKey()) return;

      // session.nextStep = enter_user_name
      if (botService.enterUserName()) return;

      // session.nextStep = enter_user_software
      if (botService.enterUserSoftware()) return;

      // session.nextStep = enter_user_broker
      if (botService.enterUserBroker()) return;

      // session.nextStep = enter_user_username
      if (botService.enterUserUsername()) return;

      // session.nextStep = enter_user_password
      if (await botService.enterUserPassword()) return;

      // session.nextStep = enter_order_isin_search
      if (await botService.enterOrderIsinSearch()) return;

      // session.nextStep = enter_order_isin
      if (botService.enterOrderIsin()) return;

      // session.nextStep = enter_order_side
      if (botService.enterOrderSide()) return;

      // session.nextStep = enter_order_price
      if (botService.enterOrderPrice()) return;

      // session.nextStep = enter_order_quantity
      if (await botService.enterOrderQuantity()) return;

      // session.nextStep = enter_order_server
      if (await botService.enterOrderServer()) return;

      // session.nextStep = enter_order_startTime
      if (await botService.enterOrderStartTime()) return;

      // session.nextStep = enter_order_endTime
      if (await botService.enterOrderEndTime()) return;

      // session.nextStep = enter_order_delay
      if (await botService.enterOrderDelayAndCreate()) return;

      // session.nextStep = fast_order_confirm
      if (await botService.fastOrderConfirmAndCreate()) return;

      // session.nextStep = enter_analyzer_isin_search
      if (await botService.enterAnalyzerIsinSearch()) return;

      // session.nextStep = enter_analyzer_isin
      if (await botService.enterAnalyzerIsinAndCreate()) return;

      // session.nextStep = user_search_result
      if (await botService.userSearchResult()) return;
    } catch (e) {
      console.log(e);

      if (e instanceof nohm.ValidationError) {
        ctx.reply(
          JSON.stringify({
            message: e.message,
            model: e.modelName,
            errors: e.errors,
          })
        );
      } else {
        ctx.reply(e.message);
      }
    }
  });

  botService.bot.on("callback_query", async (ctx) => {
    try {
      // order_list_page_1
      if (await botService.getOrderListPage(ctx)) return;

      // user_list_page_1
      if (await botService.getUserListPage(ctx)) return;

      // user_for_order_page_1
      if (await botService.getUserForOrderListPage(ctx)) return;
    } catch (e) {
      console.log(e);

      if (e instanceof nohm.ValidationError) {
        ctx.reply(
          JSON.stringify({
            message: e.message,
            model: e.modelName,
            errors: e.errors,
          })
        );
      } else {
        ctx.reply(e.message);
      }
    }
  });

  botService.bot.launch();
});
