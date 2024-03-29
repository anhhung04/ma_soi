const mongoose = require("mongoose");
const { rolesMap } = require("../data/rolesData/role");
class Role extends mongoose.SchemaType {
  constructor(key, options) {
    super(key, options, "Role");
  }
  cast(val) {
    if (!rolesMap.has(val)) {
      let typeError = new TypeError(`${val} is not accepted role.`);
      throw typeError;
    }
    return val;
  }
}

mongoose.Schema.Types.Role = Role;

const playerSchema = new mongoose.Schema(
  {
    discord_id: {
      type: String,
      require: true,
      unique: true,
    },
    alive: {
      type: Boolean,
      default: true,
    },
    game_id: {
      type: mongoose.Types.ObjectId,
      require: true,
    },
    role: Role,
    protect: String,
    kill: String,
    die_reason: String,
  },
  { timestamps: true }
);

playerSchema.statics.kill = async function (
  discord_id,
  dieReason = "werewolf"
) {
  let diePlayerIndexInCupidPair, guild, gameThread, diePlayerDiscord;
  const client = require("../index");
  const Game = require("./game");
  let diePlayer = await this.findOne({ discord_id });
  let game = await Game.findById(diePlayer?.game_id);
  if (!diePlayer) throw new Error("Can not find player to kill");
  guild = await client.guilds.fetch(game.guild_id);
  gameThread = await guild.channels.fetch(game.thread_id);
  diePlayerDiscord = await guild.members.fetch(discord_id);
  if (rolesMap.get(diePlayer.role).executeAfterDied) {
    let roleController = require(`../rolesController/${diePlayer.role}.js`);
    if (typeof roleController.executeAfterDied == "function")
      await roleController.executeAfterDied(discord_id);
  }
  diePlayer.alive = false;
  diePlayer.die_reason = dieReason;
  diePlayerIndexInCupidPair = game.cupid_pair.indexOf(discord_id);

  if (diePlayerIndexInCupidPair >= 0) {
    let partnerIndex = 1 - diePlayerIndexInCupidPair; // index only accept 2 values: 0 and 1
    let partnerId = game.cupid_pair[partnerIndex];
    game.cupid_pair = [];
    await game.save();
    await this.kill(partnerId);
  }
  await game.save();
  await gameThread.send(`${diePlayerDiscord.user} đã chết.`);

  return diePlayer.save();
};

const playerModel = mongoose.model("Player", playerSchema);

module.exports = playerModel;
