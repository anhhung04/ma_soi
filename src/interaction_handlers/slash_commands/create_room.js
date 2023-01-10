const {
  SlashCommandBuilder,
  CommandInteraction,
  ActionRowBuilder,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  ButtonInteraction,
  ComponentType,
  Message,
  ChannelType,
} = require("discord.js");
const { minPlayers, maxPlayers } = require("../../config.json");
//TODO: uncomment when finish
// if (minPlayers < 3 || maxPlayers > 25)
//   throw new Error("Chỉ chấp nhận từ 3 tới 25 người chơi.");
const { rolesMap, rolesButton } = require("../../data/rolesData/role.js");
const Game = require("../../models/game");

const rolesInGameEmbed = new EmbedBuilder()
  .setColor(Colors.Blue)
  .setTitle("Các vai trò được chọn:")
  .setTimestamp()
  .setDescription("Bấm các nút bên dưới để chọn vai trò");

const undoButton = new ButtonBuilder()
  .setCustomId("undo")
  .setLabel("Hoàn tác")
  .setStyle(ButtonStyle.Danger);

const createRoomButton = new ButtonBuilder()
  .setCustomId("create_room")
  .setLabel("Tạo phòng")
  .setStyle(ButtonStyle.Success);

var rolesRows = [];
for (let i = 0; i < rolesButton.length; i += 5) {
  rolesRows.push(
    new ActionRowBuilder().addComponents(rolesButton.slice(i, i + 5))
  );
}

const undoCreateRoomRows = new ActionRowBuilder().addComponents([
  undoButton,
  createRoomButton,
]);

const playersInGameEmbed = new EmbedBuilder()
  .setColor(Colors.Blue)
  .setTitle("Những người đã tham gia phòng: ")
  .setTimestamp()
  .setDescription("Bấm các nút bên dưới để tham gia hoặc rời phòng");
const joinRoomButton = new ButtonBuilder()
  .setLabel("Tham gia")
  .setCustomId("join_room")
  .setStyle(ButtonStyle.Success);
const leaveRoomButton = new ButtonBuilder()
  .setLabel("Rời phòng")
  .setStyle(ButtonStyle.Danger)
  .setCustomId("leave_room");
const startGameButton = new ButtonBuilder()
  .setCustomId("start_game")
  .setLabel("Bắt đầu")
  .setStyle(ButtonStyle.Success);

const joinLeaveRoomRow = new ActionRowBuilder().addComponents([
  leaveRoomButton,
  joinRoomButton,
  startGameButton,
]);
const data = new SlashCommandBuilder()
  .setName("create_room")
  .setDescription("Khởi tạo ván chơi")
  .addIntegerOption((opt) =>
    opt
      .setName("total_players")
      .setDescription("Tổng số người chơi")
      .setMinValue(minPlayers)
      .setMaxValue(maxPlayers)
      .setRequired(true)
  );

/**
 *
 * @param {CommandInteraction} interaction
 * @param {String} messageId
 */

module.exports = {
  data: data,
  /**
   * @param {CommandInteraction} interaction
   */
  async execute(interaction) {
    try {
      await interaction.deferReply();
      let max_roles = interaction.options.getInteger("total_players");
      let rolesInGame = [];
      if (interaction.channel.type != ChannelType.GuildText) {
        return interaction.reply({
          content: "Không thể sử dụng lệnh này ở đây",
          ephemeral: true,
        });
      }
      /**
       * @type {Message}
       */
      const replyMessage = await interaction.editReply({
        content: "Chọn vai trò:",
        embeds: [rolesInGameEmbed],
        components: [...rolesRows, undoCreateRoomRows],
        fetchReply: true,
      });
      const collector = interaction.channel.createMessageComponentCollector({
        componentType: ComponentType.Button,
        time: 300000,
      });
      collector.on(
        "collect",
        /**
         *
         * @param {ButtonInteraction} i
         */
        async function (i) {
          try {
            if (
              i.message.id != replyMessage.id ||
              interaction.user.id != i.user.id
            )
              return;
            await i.deferReply({
              ephemeral: true,
            });
            if (i.customId === "create_room") {
              if (rolesInGame.length != max_roles) {
                return i.editReply(
                  "Chưa chọn đủ vai trò " +
                    `(${rolesInGame.length}/${max_roles})`
                );
              }
              i.editReply("Đã tạo phòng");
              return collector.stop("create_room");
            }
            let addedRole = i.customId;
            if (addedRole == "undo") rolesInGame.pop();
            else if (rolesInGame.length >= max_roles) {
              await i.editReply("Đã đủ số lượng cho phép.");
              return;
            } else rolesInGame.push(addedRole);
            if (rolesInGame.length > 0) {
              let counter = {};
              let fields = [];
              for (let i = 0; i < rolesInGame.length; i++) {
                let role = rolesInGame[i];
                counter[role] ? ++counter[role] : (counter[role] = 1);
              }
              for (let role in counter) {
                fields.push({
                  name: rolesMap.get(role).name,
                  value: counter[role].toString(),
                  inline: true,
                });
              }
              rolesInGameEmbed.setFields(fields);
            } else {
              delete rolesInGameEmbed.data.fields;
            }
            await interaction.editReply({
              embeds: [rolesInGameEmbed],
            });
            await i.editReply({
              content: `Đã thay đổi`,
              ephemeral: true,
            });
          } catch (err) {
            console.log(err);
          }
        }
      );
      collector.once("end", async (collected, reason) => {
        try {
          if (reason == "time") {
            return interaction.channel.send(
              "Hết thời gian chọn vai trò, hãy bắt đầu lại ván chơi."
            );
          } else if (reason == "create_room") {
            await interaction.editReply({
              embeds: [],
              components: [],
              content: "Thread chơi ma sói",
            });
            let thread = await replyMessage.startThread({
              name: `Ma sói (${max_roles} người chơi)`,
            });
            await Game.create({
              thread_id: thread.id,
              guild_id: thread.guildId,
              guild_name: thread.guild.name,
              roles_in_game: rolesInGame,
              total_player: max_roles,
            });
            await thread.send({
              embeds: [playersInGameEmbed],
              components: [joinLeaveRoomRow],
              fetchReply: true,
            });
          }
        } catch (err) {
          console.log(err);
        }
      });
    } catch (err) {
      console.log(err);
    }
  },
};
