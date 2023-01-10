const {
  ThreadChannel,
  Colors,
  StringSelectMenuInteraction,
} = require("discord.js");
const Player = require("../models/player");
const { nightFunctionCollector } = require("../frameworks/collector");
const { roleValidation } = require("../frameworks/valid");
const { rolesMap } = require("../data/rolesData/role");

/**
 *
 * @param {StringSelectMenuInteraction} i
 */
async function collectFunction(i) {
  if (!(await roleValidation(i.channel, i.user.id, "seer")))
    return i.reply({
      content: "Bạn không thể thực hiện chức năng này",
    });
  await i.deferReply({ ephemeral: true });

  let guessedPlayer = await Player.findOne({
    discord_id: i.values[0],
  });
  let guessedPlayerDiscord = await i.guild.members.fetch(
    guessedPlayer.discord_id
  );

  await i.message.edit({
    components: [],
  });

  return i.editReply({
    ephemeral: true,
    content: `Vai trò của ${guessedPlayerDiscord.displayName}: \n -> ${
      rolesMap.get(guessedPlayer.role).name
    }`,
  });
}

module.exports = {
  name: "seer",
  /**
   *
   * @param {ThreadChannel} gameThread
   */
  async nightExecute(gameThread) {
    try {
      await nightFunctionCollector(
        gameThread,
        "Dân làng còn sống: ",
        "Tiên tri muốn biết vai trò của ai?",
        "seer_select",
        Colors.DarkPurple,
        collectFunction,
        null,
        20,
        "tiên tri"
      );
    } catch (err) {
      console.log(err);
    }
  },
};
