const { Message } = require("discord.js");
const { startNight } = require("../controller/host");
module.exports = {
  name: "start_night",
  /**
   *
   * @param {Message} message
   * @param {String} args
   */
  async execute(message, args) {
    try {
      if (!message.author.bot || message.author.id != message.client.user.id)
        return;
      return startNight(message.channel);
    } catch (err) {
      console.log(err);
    }
  },
};
