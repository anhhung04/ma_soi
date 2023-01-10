const { ButtonInteraction, EmbedBuilder } = require("discord.js");
const { execute: leaveRoomExeCute } = require("../slash_commands/leave_room");
module.exports = {
  name: "leave_room",
  /**
   *
   * @param {ButtonInteraction} interaction
   */
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    let playerInGameEmbed = EmbedBuilder.from(interaction.message.embeds[0]);
    let fields = playerInGameEmbed.data.fields || [];
    for (let i = 0; i < fields.length; i++) {
      if (fields[i].value == interaction.user.username) {
        fields.splice(i, 1);
        break;
      }
    }
    if (fields.length > 0) {
      playerInGameEmbed.setFields(fields);
    } else {
      delete playerInGameEmbed.data.fields;
    }
    await interaction.message.edit({
      embeds: [playerInGameEmbed],
    });
    await leaveRoomExeCute(interaction);
  },
};
