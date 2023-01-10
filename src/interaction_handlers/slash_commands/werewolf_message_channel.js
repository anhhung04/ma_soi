const { SlashCommandBuilder, CommandInteraction } = require("discord.js");
const Game = require("../../models/game");
const Player = require("../../models/player");
const { rolesMap } = require("../../data/rolesData/role");

const data = new SlashCommandBuilder()
  .setName("werewolf_message_channel")
  .setDescription("Nhắn tin với kênh bí mật của sói")
  .addStringOption((opt) =>
    opt.setName("content").setDescription("Nội dung tin nhắn")
  );

module.exports = {
  data: data,
  /**
   *
   * @param {CommandInteraction} interaction
   */
  async execute(interaction) {
    let messageSend = await interaction.options.getString("content");
    if (!messageSend) messageSend = "";
    await interaction.deferReply({ ephemeral: true });
    let player = await Player.findOne({ discord_id: interaction.user.id });
    let game = await Game.findOne({ thread_id: interaction.channelId });
    if (
      !player ||
      rolesMap.get(player.role).party ||
      !game ||
      !game._id.equals(player.game_id)
    )
      return interaction.editReply({
        content: "Bạn không thể sử dụng chức năng này.",
      });
    let playerDiscord = interaction.member;

    game.werewolf_chat += messageSend
      ? `${playerDiscord.displayName}: ${messageSend} \n`
      : "";

    let lines = game.werewolf_chat.split("\n");
    let replyMessage = lines.slice(-15).join("\n");

    game.werewolf_chat = replyMessage;
    await game.save();

    return interaction.editReply(replyMessage);
  },
};
