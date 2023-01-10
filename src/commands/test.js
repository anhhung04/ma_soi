const {
  Message,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
} = require("discord.js");
const { Model } = require("mongoose");
const { EmbedBuilder, Colors, AttachmentBuilder } = require("discord.js");
const wait = require("wait");
const { rolesMap } = require("../data/rolesData/role");
/**
 * @type {Model}
 */
const Player = require("../models/player");
const { nightExecute } = require("../rolesController/seer");

module.exports = {
  name: "test",
  aliases: ["t"],
  /**
   *
   * @param {Message} message
   * @param {String} arg
   */
  async execute(message, arg) {
    try {
      await nightExecute(message.channel);
    } catch (err) {
      console.log(err);
    }
  },
};
