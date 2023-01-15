const {
  ThreadChannel,
  Colors,
  StringSelectMenuBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ComponentType,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const wait = require("wait");
const Game = require("../models/game");

module.exports = {
  /**
   *
   * @param {ThreadChannel} gameThread
   * @param {String} embedTitle
   * @param {String} stringSelectPlaceHolder
   * @param {String} menuId
   * @param {Colors} embedColor
   * @param {Function} collectCallback
   * @param {Function} endCallback
   * @param {Number} time
   * @param {String} turnName
   */
  async nightFunctionCollector(
    gameThread,
    embedTitle,
    stringSelectPlaceHolder,
    menuId,
    embedColor,
    collectCallback,
    endCallback,
    time,
    turnName
  ) {
    try {
      const alivePlayers = await Game.getAlivePlayers(gameThread.id);
      const alivePlayersOptions = await Promise.all(
        alivePlayers.map(async function (p) {
          let discord_id = p.discord_id;
          let playerDiscordAccount = await gameThread.guild.members.fetch(
            discord_id
          );
          return new StringSelectMenuOptionBuilder()
            .setLabel(playerDiscordAccount.displayName)
            .setValue(discord_id);
        })
      );
      const alivePlayersFields = alivePlayersOptions.map((sopt) => ({
        name: sopt.data.label,
        value: "\u200B",
        inline: true,
      }));
      const alivePlayerEmbed = new EmbedBuilder()
        .setTitle(embedTitle)
        .setColor(embedColor)
        .setTimestamp()
        .setFields(alivePlayersFields);
      const selectPlayerMenu = new StringSelectMenuBuilder()
        .setCustomId(menuId)
        .setOptions(alivePlayersOptions)
        .setMaxValues(1)
        .setPlaceholder(stringSelectPlaceHolder);

      await this.startTurn(gameThread, turnName, time);

      const mess = await gameThread.send({
        embeds: [alivePlayerEmbed],
        components: [new ActionRowBuilder().addComponents(selectPlayerMenu)],
      });

      const collector = mess.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: time * 1000,
      });

      collector.on("collect", collectCallback);
      collector.once("end", endCallback);

      await wait(time * 1000);

      await this.endTurn(gameThread, turnName);
    } catch (err) {
      console.log(err);
    }
  },
  /**
   *
   * @param {ThreadChannel} gameThread
   * @param {String} turnName
   * @param {Number} time
   * @returns
   */
  async startTurn(gameThread, turnName, time) {
    return gameThread.send({
      embeds: [
        {
          title: `Bắt đầu lượt của ${turnName} (${time} giây)`,
          color: embedColor,
        },
      ],
    });
  },
  /**
   *
   * @param {ThreadChannel} gameThread
   * @param {String} turnName
   * @returns
   */
  async endTurn(gameThread, turnName) {
    return gameThread.send({
      embeds: [
        {
          title: `Kết thúc lượt của ${turnName}`,
          color: embedColor,
        },
      ],
    });
  },
};
