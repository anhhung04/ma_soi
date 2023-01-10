const { ButtonInteraction, EmbedBuilder } = require("discord.js");
const Game = require("../../models/game");
const Player = require("../../models/player");
module.exports = {
  name: "join_room",
  /**
   *
   * @param {ButtonInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({
      ephemeral: true,
    });
    const { channelId, guildId } = interaction;
    const gameDB = await Game.findOne({
      thread_id: channelId,
      guild_id: guildId,
    });
    const playerDB = await Player.findOne({
      discord_id: interaction.user.id,
    });
    if (gameDB.total_player == gameDB.players?.length)
      return interaction.editReply({
        content: "Phòng đã đầy",
      });
    if (playerDB)
      return interaction.editReply({
        content: "Bạn đã ở trong một phòng chơi rồi",
      });
    const newPlayerDB = await Player.create({
      discord_id: interaction.user.id,
      game_id: gameDB._id,
    });
    gameDB.players.push(newPlayerDB._id);
    await gameDB.save();
    const playerInGameEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    playerInGameEmbed.addFields([
      {
        name: interaction.member.displayName,
        value: interaction.user.username,
      },
    ]);
    await interaction.message.edit({
      embeds: [playerInGameEmbed],
    });
    return interaction.editReply("Đã tham gia phòng");
  },
};
