const { Schema, Types, model } = require("mongoose");
const Player = require("./player");

const gameSchema = new Schema(
  {
    thread_id: {
      type: String,
      require: true,
    },
    guild_id: {
      type: String,
      require: true,
    },
    guild_name: {
      type: String,
      require: true,
    },
    roles_in_game: {
      type: [String],
      default: [],
    },
    total_player: {
      type: String,
      require: true,
    },
    day_index: {
      type: Number,
      default: 1,
    },
    players: {
      type: [Types.ObjectId],
      ref: "Player",
      default: [],
    },
    votes: {
      type: Object,
      default: {},
    },
    werewolf_chat: {
      type: String,
      default: "",
    },
    kills_in_night: {
      type: [Types.ObjectId],
      ref: "Player",
    },
    witch_heal: String,
    witch_poison: String,
  },
  { timestamps: true }
);

gameSchema.statics.end = async function (thread_id) {
  const gameDB = await this.findOne({
    thread_id: thread_id,
  });
  await Game.deleteById(gameDB._id);
  await Player.deleteMany({ game_id: gameDB._id });
  return;
};

gameSchema.statics.getAlivePlayers = async function (thread_id) {
  const gameDB = await this.findOne({
    thread_id: thread_id,
  }).populate("players");
  return gameDB.players.filter((p) => p.alive);
};

const gameModel = model("Game", gameSchema);

module.exports = gameModel;
