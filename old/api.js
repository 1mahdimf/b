const express = require("express");
const bodyParser = require("body-parser");

const { setObjectRedis, getObjectRedis } = require("./helpers/redis");

const app = express();

app.use(bodyParser.json());

app.post("/easytrader/set-token", async (req, res) => {
  let tokens = await getObjectRedis("tokens");

  if (tokens) {
    const foundIndex = tokens.findIndex(
      token =>
        token.type === "easytrader" && token.user === req.body.mfdOnlineUserName
    );
    if (foundIndex !== -1) tokens.splice(foundIndex, 1);
  } else {
    tokens = [];
  }

  tokens.push({
    type: "easytrader",
    user: req.body.mfdOnlineUserName,
    name: req.body.customerTitle,
    headers: { Authorization: req.body.token }
  });

  setObjectRedis("tokens", tokens);
  res.status(200).send("OK");
});

app.post("/onlineplus/set-token", async (req, res) => {
  // setObjectRedis('tokens', null);
  let tokens = await getObjectRedis("tokens");

  if (tokens) {
    const foundIndex = tokens.findIndex(
      token =>
        token.type === "onlineplus" &&
        token.broker === req.body.broker &&
        token.user === req.body.userName
    );
    if (foundIndex !== -1) tokens.splice(foundIndex, 1);
  } else {
    tokens = [];
  }

  tokens.push({
    type: "onlineplus",
    broker: req.body.broker,
    user: req.body.userName,
    name: req.body.customerTitle,
    headers: { cookie: req.body.cookie }
  });

  setObjectRedis("tokens", tokens);
  res.status(200).send("OK");
});

app.post("/agah/set-token", async (req, res) => {
  let tokens = await getObjectRedis("tokens");

  if (tokens) {
    const foundIndex = tokens.findIndex(
      token => token.type === "agah" && token.user === req.body.customerId
    );
    if (foundIndex !== -1) tokens.splice(foundIndex, 1);
  } else {
    tokens = [];
  }

  tokens.push({
    type: "agah",
    user: req.body.customerId,
    name: req.body.userTitle,
    username: req.body.Username,
    headers: { cookie: req.body.cookie }
  });

  setObjectRedis("tokens", tokens);
  res.status(200).send("OK");
});

app.post("/exir/set-token", async (req, res) => {
  // setObjectRedis('tokens', null);
  let tokens = await getObjectRedis("tokens");

  if (tokens) {
    const foundIndex = tokens.findIndex(
      token =>
        token.type === "exir" &&
        token.broker === req.body.broker &&
        token.user === req.body.userName
    );
    if (foundIndex !== -1) tokens.splice(foundIndex, 1);
  } else {
    tokens = [];
  }

  tokens.push({
    type: "exir",
    broker: req.body.broker,
    user: req.body.userName,
    name: req.body.customerTitle,
    headers: { cookie: req.body.cookie }
  });

  setObjectRedis("tokens", tokens);
  res.status(200).send("OK");
});

app.listen(3000, () => {
  console.log("listening on 3000");
});
