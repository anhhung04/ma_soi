const fs = require("node:fs");
const { timeDiscussion } = require("../config.json");
if (timeDiscussion < 6)
  throw new Error("Thời gian thảo luận phải lớn hơn 6 giây");
const {
  TextChannel,
  EmbedBuilder,
  Colors,
  AttachmentBuilder,
  ThreadChannel,
} = require("discord.js");
const wait = require("wait");
const { rolesMap } = require("../data/rolesData/role");
const Game = require("../models/game");
const roleFileControllers = fs
  .readdirSync("./src/rolesController")
  .filter((f) => f.endsWith(".js"));
const roleControllers = new Map();
for (let file of roleFileControllers) {
  const roleController = require(`../rolesController/${file}`);
  roleControllers.set(file.slice(0, file.length - 3), roleController);
}

module.exports = {
  /**
   *
   * @param {TextChannel} channel
   */
  async startNight(channel) {
    try {
      const gameDB = await Game.findOne({
        thread_id: channel.id,
      });
      const roles_in_game = [...new Set(gameDB.roles_in_game)].sort((a, b) => {
        let iA = rolesMap.get(a).index;
        let iB = rolesMap.get(b).index;
        return iA - iB;
      });
      const { day_index } = gameDB;
      const startNightEmbed = new EmbedBuilder()
        .setColor(Colors.Purple)
        .setTimestamp()
        .setTitle(`Đêm thứ ${day_index}`)
        .setImage("attachment://night.jpeg");
      await channel.send({
        embeds: [startNightEmbed],
        files: [new AttachmentBuilder("./src/data/night.jpeg")],
      });

      for (let i = 0; i < roles_in_game.length; i++) {
        let role = roles_in_game[i];
        let roleController = roleControllers.get(role);
        if (typeof roleController?.nightExecute == "function") {
          await roleController.nightExecute(channel);
        }
      }
      await channel.send("start_day");
    } catch (err) {
      console.log(err);
    }
  },
  /**
   *
   * @param {TextChannel} channel
   */ async startDay(channel) {
    try {
      const gameDB = await Game.findOne({
        guild_id: channel.guildId,
        thread_id: channel.id,
      });
      const { day_index } = gameDB;
      const startDayEmbed = new EmbedBuilder()
        .setColor(Colors.Yellow)
        .setTimestamp()
        .setTitle(`Ngày thứ ${day_index}`)
        .setImage("attachment://morning.jpg");
      const discussionEmbed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`Dân làng có ${timeDiscussion} giây để thảo luận`)
        .setTimestamp();
      const counterEmbed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle(`--- ${5} ---`);
      await channel.send({
        embeds: [startDayEmbed, discussionEmbed],
        files: [new AttachmentBuilder("./src/data/morning.jpg")],
      });
      gameDB.day_index = day_index + 1;
      await gameDB.save();
      await wait((timeDiscussion - 5) * 1000);
      const counterMess = await channel.send({
        embeds: [counterEmbed],
      });
      for (let i = 4; i >= 0; i--) {
        counterEmbed.setTitle(`--- ${i} ---`);
        await wait(1000);
        await counterMess.edit({
          embeds: [counterEmbed],
        });
      }
      counterEmbed
        .setTitle(`--- Hết thời gian thảo luận ---`)
        .setColor(Colors.Red);
      await counterMess.edit({
        embeds: [counterEmbed],
      });
      await channel.send("vote");
    } catch (err) {
      console.log(err);
    }
  },
  /**
   *
   * @param {ThreadChannel} gameChannel
   */
  async checkWinCondition(gameChannel) {
    try {
      const winLoseEmbed = new EmbedBuilder().setTimestamp();
      let endGame = true;
      const alivePlayers = await Game.getAlivePlayers(gameChannel.id);
      const game = await Game.findOne({ thread_id: gameChannel.id });
      const villagers = alivePlayers.filter((p) => rolesMap.get(p.role).party);
      if (alivePlayers.length == 2 && game.cupid_pair.length == 2) {
        let playerOne = await gameChannel.guild.members.fetch(
          game.cupid_pair[0]
        );
        let playerTwo = await gameChannel.guild.members.fetch(
          game.cupid_pair[1]
        );
        winLoseEmbed.setTitle(
          `Cặp đôi ${playerOne.displayName} và ${playerTwo.displayName} đã chiến thắng.`
        );
      } else if (alivePlayers.length >= 2 * villagers.length) {
        winLoseEmbed.setTitle("Phe sói thắng").setColor(Colors.Red);
      } else if (alivePlayers.length == villagers.length) {
        winLoseEmbed.setTitle("Phe dân làng thắng").setColor(Colors.Green);
      } else endGame = false;
      if (endGame) {
        await Game.end(gameChannel.id);
        await gameChannel.send({
          embeds: [winLoseEmbed],
        });
        await gameChannel.send("Thread tự động xóa sau 3 giây...");
        await wait(3000);
        const startMess = await gameChannel.fetchStarterMessage();
        await startMess.edit({ content: "", embeds: [winLoseEmbed] });
        await gameChannel.delete();
      }

      return endGame;
    } catch (err) {
      console.log(err);
    }
  },
};
