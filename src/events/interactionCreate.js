const timers = new Map();
const interactionHandler = require("../interaction_handlers/interaction_handler.js");
const { timeLimitInteractionCreate } = require("../config.json");
const { BaseInteraction } = require("discord.js");

module.exports = {
  name: "interactionCreate",
  /**
   *
   * @param {BaseInteraction} interaction
   */
  async execute(interaction) {
    if (!interaction.isCommand()) {
      return interactionHandler(interaction);
    }
    let timestamp = interaction.createdTimestamp;
    let time_limit = timeLimitInteractionCreate * 1000;
    let last_timestamp = timers.get(interaction.user.id) || 0;
    let diff = timestamp - last_timestamp;
    timers.set(interaction.user.id, Date.now());

    if (diff <= time_limit) {
      let left_sec = Math.floor((time_limit - diff) / 1000);
      if (left_sec > 0) {
        return interaction.channel.send({
          content: `Bạn thao tác hơi nhanh rồi, hãy chờ thêm ${left_sec} giây!`,
        });
      }
    } else {
      return interactionHandler(interaction);
    }
  },
};
