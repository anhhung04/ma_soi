const {
  ButtonInteraction,
  GuildMemberManager,
  TextChannel,
  EmbedBuilder,
  Colors,
} = require("discord.js");
const Game = require("../../models/game");
const Player = require("../../models/player");
const wait = require("wait");
const { rolesMap } = require("../../data/rolesData/role");

/**
 *
 * @param {GuildMemberManager} guildMembers
 * @param {Array} roles_in_game
 * @param {Array} players_in_game
 */
async function sendRole(guildMembers, roles_in_game, players_in_game) {
  try {
    const embedRole = new EmbedBuilder().setColor(Colors.Green).setTimestamp();
    return Promise.all([
      players_in_game.map(async function (player, index) {
        let embedSend = EmbedBuilder.from(embedRole);
        let role = roles_in_game[index];
        let roleInfo = rolesMap.get(role);
        let member = await guildMembers.fetch(player.discord_id);
        embedSend
          .setTitle(`Vai trò của bạn: ${roleInfo.name}`)
          .setDescription(roleInfo.description);
        await member.send({
          embeds: [embedSend],
        });
        await Player.updateOne(
          {
            discord_id: player.discord_id,
          },
          {
            role: role,
          }
        );
      }),
    ]);
  } catch (err) {
    console.log(err);
  }
}
/**
 *
 * @param {TextChannel} channel
 * @param {Number} time seconds
 */
async function counter(channel, time) {
  {
    const counterEmbed = new EmbedBuilder().setColor(Colors.Green);
    counterEmbed.setTitle(`---  ${time}  ---`);
    const counterMessage = await channel.send({
      embeds: [counterEmbed],
    });
    for (let i = time - 1; i >= 0; i--) {
      counterEmbed.setTitle(`---  ${i}  ---`);
      await Promise.all([
        counterMessage.edit({
          embeds: [counterEmbed],
        }),
        wait(1000),
      ]);
    }
    counterEmbed.setTitle(`--- Bắt đầu ---`);
    await counterMessage.edit({
      embeds: [counterEmbed],
    });
    return;
  }
}

module.exports = {
  name: "start_game",
  /**
   *
   * @param {ButtonInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    const gameDB = await Game.findOne({
      guild_id: interaction.guildId,
      thread_id: interaction.channelId,
    }).populate("players");
    const activatedUser = await Player.findOne({
      discord_id: interaction.user.id,
    });
    const { players, roles_in_game } = gameDB;
    if (!activatedUser || !activatedUser.game_id.equals(gameDB._id))
      return interaction.editReply("Bạn không ở trong ván chơi này");
    if (players.length != roles_in_game.length)
      return interaction.editReply("Chưa đủ người chơi");
    await interaction.editReply(`Đã bắt đầu ván chơi`);
    await interaction.channel.send(
      `${interaction.member.displayName} đã bắt đầu.`
    );
    for (let i = 0; i < roles_in_game.length; i++) {
      let ranSwapIndex = Math.floor(Math.random() * (roles_in_game.length - 1));
      let temp = roles_in_game[i];
      roles_in_game[i] = roles_in_game[ranSwapIndex];
      roles_in_game[ranSwapIndex] = temp;
    }
    gameDB.roles_in_game = roles_in_game;
    await gameDB.save();
    await Promise.all([
      sendRole(interaction.guild.members, roles_in_game, players),
      counter(interaction.channel, 10),
    ]);
    await interaction.message.edit({
      components: [],
    });
    return interaction.channel.send("start_night");
  },
};
