const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Player = require("../../models/player");
const Game = require("../../models/game");

const data = new SlashCommandBuilder()
  .setName("leave_room")
  .setDescription("Rời phòng chơi");

module.exports = {
  data: data,
  /**
   *
   * @param {CommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      const playerDB = await Player.findOne({
        discord_id: interaction.user.id,
      });
      if (!interaction.deferred) {
        await interaction.deferReply({ ephemeral: true });
      }
      if (!playerDB)
        return interaction.editReply({
          content: "Bạn không ở trong phòng nào.",
        });
      const gameDB = await Game.findOne({
        _id: playerDB.game_id,
      });
      if (!gameDB)
        return interaction.editReply(
          "Đã có lỗi trong hệ thống, hãy liên hệ admin để được xử lý."
        );
      const guildName = gameDB.guild_name;
      const deletePlayerIndex = gameDB.players.indexOf(playerDB._id);
      gameDB.players.splice(deletePlayerIndex, 1);
      await gameDB.save();
      await playerDB.delete();
      return interaction.editReply(`Đã rời phòng tại server \"${guildName}\"`);
    } catch (err) {
      console.log(err);
    }
  },
};
