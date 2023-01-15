const { Message } = require("discord.js");
const { startNight } = require("../controller/host");
const Game = require("../models/game");
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
      const game = await Game.findOne({ thread_id: message.channelId });
      game.is_day = false;
      await game.save();
      return startNight(message.channel);
    } catch (err) {
      console.log(err);
    }
  },
};
