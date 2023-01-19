const Game = require("../models/game");
const Player = require("../models/player");
const {
  EmbedBuilder,
  Colors,
  StringSelectMenuInteraction,
} = require("discord.js");
const { nightFunctionCollector } = require("../frameworks/collector");
const { roleValidation } = require("../frameworks/valid");
const wait = require("wait");

/**
 *
 * @param {StringSelectMenuInteraction} i
 */
async function hunterChooseFunction(i) {
  try {
    let chosenPlayerDiscordId, chosenPlayerDiscord;
    await i.deferReply({ ephemeral: true });
    if ((await roleValidation(i.channel, i.user.id, "hunter")) == false)
      return i.editReply("Bạn không thể thực hiện chức năng này");
    chosenPlayerDiscordId = i.values[0];
    chosenPlayerDiscord = await i.guild.members.fetch(chosenPlayerDiscordId);
    await i.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTitle(`Thợ săn đã chọn ${chosenPlayerDiscord.displayName}`),
      ],
    });
    await Player.kill(chosenPlayerDiscordId);
    await i.editReply(`Bạn đã bắn ${chosenPlayerDiscord.displayName}`);
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  /**
   *
   * @param {String} discord_id
   */
  async executeAfterDied(discord_id) {
    try {
      const client = require("../index.js");
      const hunter = await Player.findOne({ discord_id });
      const game = await Game.findById(hunter.game_id);
      const guild = await client.guilds.fetch(game.guild_id);
      const hunterDiscord = await guild.members.fetch(discord_id);
      const gameThread = await guild.channels.fetch(game.thread_id);
      await nightFunctionCollector(
        gameThread,
        `${hunterDiscord.displayName} là thợ săn, thợ săn hãy chọn một người dưới đây để nổ súng: `,
        "Chọn một người để nổ súng (20 giây)",
        "hunter_choose",
        Colors.Yellow,
        hunterChooseFunction,
        null,
        20,
        "thợ săn",
        1
      );
      await wait(20000);
    } catch (error) {
      console.log(error);
    }
  },
};
