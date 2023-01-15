const {
  SlashCommandBuilder,
  CommandInteraction,
  EmbedBuilder,
  Colors,
} = require("discord.js");
const Game = require("../../models/game");
const Player = require("../../models/player");
const { rolesMap } = require("../../data/rolesData/role");
const data = new SlashCommandBuilder()
  .setName("throw_holy_water")
  .setDescription("Chức năng đặc biệt của thầy đồng")
  .addUserOption((opt) =>
    opt
      .setName("target")
      .setDescription("Chọn người để quãng bình")
      .setRequired(true)
  );

module.exports = {
  data: data,
  /**
   *
   * @param {CommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const game = await Game.findOne({ thread_id: interaction.channelId });
      const priest = await Player.findOne({ discord_id: interaction.user.id });
      const priestDiscord = interaction.member;
      const targetUser = interaction.options.getUser("target");
      const target = await Player.findOne({ discord_id: targetUser.id });
      const targetDiscord = await interaction.guild.members.fetch(
        targetUser.id
      );
      const werewolfKilledEmbed = new EmbedBuilder()
        .setColor(Colors.Red)
        .setTimestamp()
        .setTitle(
          `${targetDiscord.displayName} là sói và đã bị giết chêt bởi thầy đồng`
        );

      const revealPriestRoleEmbed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTimestamp()
        .setTitle(`${priestDiscord.displayName} là thầy đồng`);

      if (!game)
        return interaction.editReply("Bạn không thể dùng chức năng này ở đây.");
      if (!priest?.role == "priest" || priest.alive == false)
        return interaction.editReply("Bạn không thể thực hiện chức năng này.");

      if (priest.used_holy_water)
        return interaction.editReply(
          "Bạn chỉ được dùng tính năng này 1 lần 1 ngày"
        );
      if (!target || !game._id.equals(target.game_id))
        return interaction.editReply(
          "Người chơi được chọn không có trong ván chơi"
        );
      if (target.alive == false)
        return interaction.editReply(
          "Bạn không thể sử dụng chức năng này cho người chết."
        );
      if (game.is_day == false)
        return interaction.editReply(
          "Bạn chỉ có thể sử dụng chức năng này vào ban ngày."
        );

      game.used_holy_water = true;

      await game.save();

      if (rolesMap.get(target.role).party)
        return interaction.editReply("Không có gì bất thường xaỷ ra");

      await interaction.channel.send({
        embeds: [werewolfKilledEmbed, revealPriestRoleEmbed],
      });

      await Player.kill(targetUser.id);

      await interaction.editReply(
        "Bạn đã chọn đúng người, hãy tự bảo vệ mình những ngày tiếp theo"
      );
    } catch (error) {
      console.log(error);
    }
  },
};
