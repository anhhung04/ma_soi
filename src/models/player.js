const mongoose = require("mongoose");
const { rolesMap } = require("../data/rolesData/role.js");
const role = require("../data/rolesData/role.js");
const Game = require("./game.js");
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
  let diePlayer = await this.findOne({ discord_id: discord_id });
  if (rolesMap.get(diePlayer.role).executeFunctionAfterVote) {
    let roleController = require(`../rolesController/${diePlayer.role}.js`);
    if (typeof roleController.executeAfterVote == "function")
      await roleController.executeAfterVote(discord_id);
  }
  diePlayer.alive = false;
  diePlayer.die_reason = dieReason;
  await Game.findByIdAndUpdate(diePlayer.game_id, {
    last_kill: diePlayer._id,
  });

  return diePlayer.save();
};

const playerModel = mongoose.model("Player", playerSchema);

module.exports = playerModel;
