const Player = require("../models/player");
const Game = require("../models/game");
const { ThreadChannel } = require("discord.js");
const { rolesMap } = require("../data/rolesData/role");

module.exports = {
  /**
   * @param {ThreadChannel} gameThread
   * @param {String} discord_id
   * @param {String} role
   */
  async roleValidation(gameThread, discord_id, role) {
    let playerDB = await Player.findOne({ discord_id });
    let gameDB = await Game.findOne({ thread_id: gameThread.id });

    return (
      gameDB &&
      playerDB &&
      rolesMap.has(role) &&
      playerDB.role == role &&
      gameDB._id.equals(playerDB.game_id)
    );
  },
};
