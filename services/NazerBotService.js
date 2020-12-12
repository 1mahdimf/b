const Telegraf = require("telegraf");
const session = require("telegraf/session");
const SocksAgent = require("socks5-https-client/lib/Agent");

const config = require("../config");

class NazerBotService {
  constructor() {
    const options = {};
    if (config.botUseProxy) {
      const socksAgent = new SocksAgent({
        socksHost: config.botProxyHost,
        socksPort: config.botProxyPort,
      });
      options.agent = socksAgent;
    }

    this.bot = new Telegraf(config.nazerBotToken, { telegram: options });
    this.bot.use(session());
    this.bot.use(this.useAccess);
  }

  useAccess({ from, reply }, next) {
    if (config.botNazerUserIds.indexOf(from.id) === -1) {
      console.log("Access deny");
      return false;
    }
    return next();
  }
}

module.exports = NazerBotService;
