const {
  ThreadChannel,
  Colors,
  StringSelectMenuInteraction,
  EmbedBuilder,
} = require("discord.js");
const Game = require("../models/game");
const Player = require("../models/player");
const { nightFunctionCollector } = require("../frameworks/collector");
const { roleValidation } = require("../frameworks/valid");
const { rolesMap } = require("../data/rolesData/role");
const wait = require("wait");
/**
 *
 * @param {StringSelectMenuInteraction} i
 */
async function choosePlayers(i) {
  try {
    let game = await Game.findOne({ thread_id: i.channelId });
    let chosenPlayerIds = i.values;
    let playerOneDiscord;
    let playerTwoDiscord;
    await i.deferReply({ ephemeral: true });
    if (!(await roleValidation(i.channel, i.user.id, "cupid")))
      return i.editReply("Bạn không thể thực hiện chức năng này");
    if (chosenPlayerIds.length == 1)
      return i.editReply("Bạn phải chọn 2 người để ghép cặp.");
    playerOneDiscord = await i.guild.members.fetch(chosenPlayerIds[0]);
    playerTwoDiscord = await i.guild.members.fetch(chosenPlayerIds[1]);
    game.cupid_pair = chosenPlayerIds;
    await game.save();
    return i.editReply(
      `Bạn đã chọn ${playerOneDiscord.displayName} và ${playerTwoDiscord.displayName} để ghép cặp.`
    );
  } catch (error) {
    console.log(error);
  }
}

module.exports = {
  /**
   *
   * @param {ThreadChannel} gameThread
   */
  async nightExecute(gameThread) {
    try {
      let pairPlayersDiscord;
      let pairPlayers;
      let pairEmbed;
      let game = await Game.findOne({ thread_id: gameThread.id });
      if (game.day_index != 1) return;
      await nightFunctionCollector(
        gameThread,
        `Dân làng`,
        "Chọn 2 người để ghép cặp với nhau",
        "cupid_chosen",
        Colors.DarkVividPink,
        choosePlayers,
        null,
        20,
        "thần tình yêu",
        2
      );
      await wait(20000);
      game = await game.save();
      if (game.cupid_pair.length < 2)
        return Game.findByIdAndUpdate(game._id, { cupid_pair: [] });
      pairPlayersDiscord = await Promise.all(
        game.cupid_pair.map((id) => gameThread.guild.members.fetch(id))
      );
      pairPlayers = await Promise.all(
        game.cupid_pair.map((id) => Player.findOne({ discord_id: id }))
      );
      pairEmbed = new EmbedBuilder()
        .setColor(Colors.DarkVividPink)
        .setTitle(
          `Thần tình yêu đã ghép cặp ${pairPlayersDiscord[0].displayName} với ${
            pairPlayersDiscord[1].displayName
          }: \n ${pairPlayersDiscord[0].displayName}: ${
            rolesMap.get(pairPlayers[0].role).name
          } \n ${pairPlayersDiscord[1].displayName}: ${
            rolesMap.get(pairPlayers[1].role).name
          }`
        );
      await Promise.all(
        pairPlayersDiscord.map((p) => p.send({ embeds: [pairEmbed] }))
      );
    } catch (error) {
      console.log(error);
    }
  },
};
