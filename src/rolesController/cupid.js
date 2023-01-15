const {
  ThreadChannel,
  Colors,
  StringSelectMenuInteraction,
} = require("discord.js");
const Game = require("../models/game");
const { nightFunctionCollector } = require("../frameworks/collector");
const { roleValidation } = require("../frameworks/valid");
/**
 *
 * @param {StringSelectMenuInteraction} i
 */
async function choosePLayerOne(i) {
  try {
    let game = await Game.findOne({ thread_id: i.channelId });
    let chosenPlayerId = i.values[0];
    let chosenPlayerDiscord;
    await i.deferReply({ ephemeral: true });
    if (!(await roleValidation(i.channel, i.user.id, "cupid")))
      return i.editReply("Bạn không thể thực hiện chức năng này");
    chosenPlayerDiscord = await i.guild.members.fetch(chosenPlayerId);
    game.cupid_pair.push(chosenPlayerId);
    await game.save();
    await i.editReply(
      `Bạn đã chọn ${chosenPlayerDiscord.displayName} để bắt đầu ghép cặp.`
    );
  } catch (error) {
    console.log(error);
  }
}
/**
 *
 * @param {StringSelectMenuInteraction} i
 */
async function choosePlayerTwo(i) {
  try {
    let game = await Game.findOne({ thread_id: i.channelId });
    let playerOneId = game.pair[0];
    let playerTwoId = i.values[0];
    let playerTwoDiscord = await i.guild.members.fetch(playerTwoId);
    await i.deferReply({ ephemeral: true });
    if (!(await roleValidation(i.channel, i.user.id, "cupid")))
      return i.editReply("Bạn không thể thực hiện chức năng này");
    if (game.cupid_pair.length > 1)
      return i.editReply("Đã có lỗi xảy ra, hãy tạo lại ván chơi.");
    if (playerOneId == playerTwoId)
      return i.editReply("Người chơi này đã được chọn");
    game.cupid_pair.push(playerTwoId);
    await game.save();
    await i.editReply(
      `Bạn đã chọn ${playerTwoDiscord.displayName} để ghép cặp.`
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
      let game = await Game.findOne({ thread_id: gameThread.id });
      const cupid = await Player.findOne({
        game_id: game._id,
        role: "cupid",
      });
      if (game.day_index != 1) return;
      await nightFunctionCollector(
        gameThread,
        `Những người chơi còn sống`,
        "Chọn người thứ 1 để ghép cặp",
        "cupid_chosen_1",
        Colors.DarkVividPink,
        choosePLayerOne,
        null,
        10,
        "thần tình yêu"
      );
      await nightFunctionCollector(
        gameThread,
        `Những người chơi còn sống`,
        "Chọn người thứ 2 để ghép cặp",
        "cupid_chosen_2",
        Colors.DarkVividPink,
        choosePlayerTwo,
        null,
        10,
        "thần tình yêu"
      );
      game = await game.save();
      console.log(game);
    } catch (error) {
      console.log(error);
    }
  },
};
