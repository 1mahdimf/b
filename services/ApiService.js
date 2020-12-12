const express = require("express");
const bodyParser = require("body-parser");

const UserService = require("./UserService");
const OrderService = require("./OrderService");

const config = require("../config/index");
const { currency, digit } = require("../helpers");

class ApiService {
  constructor(botService) {
    this.botService = botService;

    this.app = express();
    this.app.use(bodyParser.json());
    this.app.use(this.useAccess);
  }

  useAccess(req, res, next) {
    if (!req.headers.authorization) {
      return res.status(403).json({ error: "No credentials sent!" });
    } else if (req.headers.authorization !== config.myApiToken) {
      return res.status(403).json({ error: "Access deny!" });
    }
    next();
  }

  listen(port = 3000) {
    this.app.listen(port, () => {
      console.log(`listening on ${port}`);
    });
  }

  getOrderList() {
    this.app.get("/orders", async (req, res) => {
      try {
        const conditions = {};

        if (req.query.server) {
          conditions.server = req.query.server;
        }

        if (req.query.status) {
          conditions.status = req.query.status;
        }

        const orders = await OrderService.listByCondition(conditions);
        res.status(200).send(orders);
      } catch (e) {
        res.status(500).send(e.message);
      }
    });
  }

  getOrderById() {
    this.app.get("/order", async (req, res) => {
      try {
        const id = parseInt(req.query.id, 10);
        const order = await OrderService.findById(id);
        res.status(200).send(order);
      } catch (e) {
        res.status(500).send(e.message);
      }
    });
  }

  updateOrderById() {
    this.app.post("/order", async (req, res) => {
      try {
        const id = req.body.id;
        const result = req.body.result;
        delete req.body.id;
        if (req.body.result) delete req.body.result;

        const findOrder = await OrderService.findById(id);

        await OrderService.update(id, req.body);

        const orderUpdated = await OrderService.findById(id);

        let updatedText = "";
        if (findOrder.quantity !== orderUpdated.quantity) {
          updatedText = `🧮 تعداد سهم: ${digit(
            orderUpdated.quantity
          )}\n💰 به ارزش: ${digit(orderUpdated.quantity * orderUpdated.price)}`;
        } else if (findOrder.status !== orderUpdated.status) {
          updatedText = `🗞 وضعیت جدید: ${orderUpdated.status}`;
        } else if (findOrder.position !== orderUpdated.position) {
          if (result) {
            updatedText = result
              .map(
                (o) =>
                  `🥇 جایگاه: ${o.position}\n🎖 جایگاه حجمی: ${o.volumetricPosition}\n⌚️ زمان: ${o.positionCreatedAt}\n🔎 وضعیت: ${o.statusText}`
              )
              .join("\n\n");
          } else {
            updatedText = `🥇 جایگاه: ${orderUpdated.position}\n🎖 جایگاه حجمی: ${orderUpdated.volumetricPosition}\n⌚️ زمان: ${orderUpdated.positionCreatedAt}\n🔎 وضعیت: ${orderUpdated.statusText}`;
          }
        }

        const message = `سفارش #${orderUpdated.id} آپدیت شد\n👨🏻 ${orderUpdated.user.name}\n📈 ${orderUpdated.isinName}\n\n${updatedText}`;

        await this.botService.bot.telegram.sendMessage(
          config.botAdminIds[0],
          message
        );

        res.status(200).send({ success: true });
      } catch (e) {
        res.status(500).send(e.message);
      }
    });
  }

  updateUserTokenByKey() {
    this.app.put("/user/token", async (req, res) => {
      try {
        let params = {
          cookie: req.body.cookie,
        };

        if (req.body.authToken) {
          params.authorization = `BasicAuthentication ${req.body.authToken}`;
        }

        await UserService.updateTokenByKey(req.body.userName, params);

        const findUser = await UserService.findByKey(req.body.userName);

        const message = `آپدیت توکن\n👨🏻 ${findUser.name}\n🔑 ${findUser.tokenUpdatedAt}\n/order_add_${findUser.id}`;

        await this.botService.bot.telegram.sendMessage(
          config.botAdminIds[0],
          message
        );

        res.status(200).send({ success: true });
      } catch (e) {
        await this.botService.bot.telegram.sendMessage(
          config.botAdminIds[0],
          `کاربر مورد نظر یافت نشد\n\n${JSON.stringify(req.body)}`
        );

        res.status(500).send(e.message);
      }
    });
  }
}

module.exports = ApiService;
