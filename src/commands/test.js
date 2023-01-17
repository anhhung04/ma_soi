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
const Player = require("../models/player");
const Game = require("../models/game");
const roleTest = "cupid";
const { nightExecute } = require("../rolesController/" + roleTest + ".js");

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
      await Player.kill("716298891586174977");
    } catch (err) {
      console.log(err);
    }
  },
};
