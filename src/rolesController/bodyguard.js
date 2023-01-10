const {
  ThreadChannel,
  Colors,
  StringSelectMenuInteraction,
  Collection,
} = require("discord.js");
const Game = require("../models/game");
const Player = require("../models/player");
const { nightFunctionCollector } = require("../frameworks/collector");
const { roleValidation } = require("../frameworks/valid");

/**
 *
 * @param {StringSelectMenuInteraction} i
 */
async function collectFunction(i) {
  try {
    await i.deferReply({ ephemeral: true });
    let choosePlayer = await Player.findOne({ discord_id: i.user.id });
    let gameDB = await Game.findOne({
      guild_id: i.guildId,
      thread_id: i.channelId,
    });
    if (!(await roleValidation(i.channel, i.user.id, "bodyguard")))
      return i.editReply({
        content: "Bạn không thể thực hiện chức năng này",
        ephemeral: true,
      });

    let pickedPlayerId = i.values[0];
    let protectedPlayer = await i.guild.members.fetch(pickedPlayerId);

    if (choosePlayer.protect && choosePlayer.protect == pickedPlayerId) {
      return i.editReply("Bạn không thể bảo vệ một người hai đêm liên tiếp");
    }

    choosePlayer.protect = pickedPlayerId;
    await choosePlayer.save();

    return i.editReply(`Bạn đã bảo vệ ${protectedPlayer.displayName}`);
  } catch (err) {
    console.log(err);
  }
}

/**
 *
 * @param {Collection} c
 * @param {String} r
 */
async function endFunction(c, r) {
  return;
}

module.exports = {
  name: "bodyguard",
  /**
   *
   * @param {ThreadChannel} gameThread
   */
  async nightExecute(gameThread) {
    try {
      await nightFunctionCollector(
        gameThread,
        "Chọn một dân làng để bảo vệ: ",
        "Chọn một người",
        "protect_menu",
        Colors.Blue,
        collectFunction,
        endFunction,
        10,
        "bảo vệ"
      );
    } catch (err) {
      console.log(err);
    }
  },
};
