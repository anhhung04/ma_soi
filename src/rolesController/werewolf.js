const {
  ThreadChannel,
  Colors,
  StringSelectMenuInteraction,
} = require("discord.js");
const Game = require("../models/game");
const Player = require("../models/player");
const wait = require("wait");
const { nightFunctionCollector } = require("../frameworks/collector");
const { roleValidation } = require("../frameworks/valid");
const werewolfReg = ["werewolf"];

function mode(array) {
  if (array.length == 0) return null;
  var modeMap = {};
  var maxEl = array[0],
    maxCount = 1;
  for (var i = 0; i < array.length; i++) {
    var el = array[i];
    if (modeMap[el] == null) modeMap[el] = 1;
    else modeMap[el]++;
    if (modeMap[el] > maxCount) {
      maxEl = el;
      maxCount = modeMap[el];
    }
  }
  return maxEl;
}

/**
 *
 * @param {StringSelectMenuInteraction} i
 */
async function collectFunction(i) {
  try {
    let choosePlayerDB = await Player.findOne({ discord_id: i.user.id });
    let gameDB = await Game.findOne({
      guild_id: i.guildId,
      thread_id: i.channelId,
    });
    await i.deferReply({ ephemeral: true });
    if (
      !(
        await Promise.all(
          werewolfReg.map((role) => roleValidation(i.channel, i.user.id, role))
        )
      ).every((e) => e)
    )
      return i.editReply({
        content: "Bạn không thể thực hiện chức năng này",
      });

    choosePlayerDB.kill = i.values[0];
    await choosePlayerDB.save();
    let werewolves = await Player.find({
      game_id: gameDB._id,
      role: {
        $in: werewolfReg,
      },
    });
    let chosenPlayers = await Promise.all(
      werewolves.map(async function (ww) {
        let chosenPlayer = await i.guild.members.fetch(ww.kill);
        let choosePlayer = await i.guild.members.fetch(ww.discord_id);
        return [choosePlayer.displayName, chosenPlayer.displayName];
      })
    );
    await i.editReply({
      content: `Sói đã chọn: \n ${chosenPlayers.map(
        (c) => `| ${c[0]}: ${c[1]} |\n`
      )}`,
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  name: "werewolf",
  /**
   *
   * @param {ThreadChannel} gameThread
   */
  async nightExecute(gameThread) {
    async function endFunction(c, r) {
      try {
        if (!r == "time") throw new Error(r);
        let gameDB = await Game.findOne({
          thread_id: gameThread.id,
        });
        let werewolves = await Player.find({
          game_id: gameDB._id,
          role: {
            $in: werewolfReg,
          },
        });
        let votedPlayers = werewolves.map((ww) => ww.kill);
        let diePlayer = mode(votedPlayers);
        if (diePlayer) await Player.kill(diePlayer);
      } catch (err) {
        console.log(err);
      }
    }
    await nightFunctionCollector(
      gameThread,
      "Dân làng còn sống: ",
      "Đêm nay sói muốn giết ai?",
      "kill_player",
      Colors.Red,
      collectFunction,
      endFunction,
      30,
      "sói"
    );
  },
};
