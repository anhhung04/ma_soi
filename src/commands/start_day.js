const { Message, Client, EmbedBuilder, Colors } = require("discord.js");
const { startDay, checkWinCondition } = require("../controller/host");
const Game = require("../models/game");

module.exports = {
  name: "start_day",
  /**
   *
   * @param {Message} message
   * @param {String} args
   */
  async execute(message, args) {
    try {
      let endGame;
      let game;
      if (!message.author.bot || message.author.id != message.client.user.id)
        return;
      game = await Game.findOne({
        thread_id: message.channelId,
      }).populate(["players", "kills_in_night"]);
      await message.channel.send({
        embeds: [
          new EmbedBuilder().setColor(Colors.Red).setTitle(
            `Đêm qua đã có ${
              game.kills_in_night.length
            } người chết: \n ${await Promise.all(
              game.kills_in_night.map(async (p) => {
                let pDiscord = await message.guild.members.fetch(p.discord_id);
                return `| ${pDiscord.displayName} | \n`;
              })
            )}`
          ),
        ],
      });
      game.kills_in_night = [];
      await game.save();
      endGame = await checkWinCondition(message.channel);
      if (!endGame) await startDay(message.channel);
    } catch (err) {
      console.log(err);
    }
  },
};
