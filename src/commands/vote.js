const {
  Message,
  StringSelectMenuBuilder,
  EmbedBuilder,
  Colors,
  ActionRowBuilder,
  StringSelectMenuOptionBuilder,
  ComponentType,
} = require("discord.js");
const Game = require("../models/game");
const Player = require("../models/player");
const { checkWinCondition } = require("../controller/host");

module.exports = {
  name: "vote",
  /**
   *
   * @param {Message} message
   * @param {String} args
   */
  async execute(message, args) {
    try {
      if (!message.author.bot || message.author.id != message.client.user.id)
        return;
      const gameDB = await Game.findOne({
        guild_id: message.guildId,
        thread_id: message.channelId,
      }).populate("players");
      const { players } = gameDB;
      const alivePlayers = players.filter((p) => p.alive);
      const alivePlayersOptions = await Promise.all(
        alivePlayers.map(async function (p) {
          let member = await message.guild.members.fetch(p.discord_id);
          return new StringSelectMenuOptionBuilder()
            .setLabel(member.displayName)
            .setValue(member.id.toString());
        })
      );
      const votes = alivePlayers.reduce(function (o, key) {
        return Object.assign(o, { [key.discord_id]: 0 });
      }, {});
      const playerVotes = new Map();

      const alivePlayersFields = alivePlayersOptions.map((p) => ({
        name: p.data.label,
        value: "0",
        inline: true,
      }));

      const voteEmbed = new EmbedBuilder()
        .setColor(Colors.Blue)
        .setTitle("Số lượng bình chọn treo cổ: ")
        .setTimestamp()
        .setFields(alivePlayersFields);
      const voteSelectMenu = new StringSelectMenuBuilder()
        .addOptions(alivePlayersOptions)
        .setMinValues(1)
        .setMaxValues(1)
        .setCustomId("vote_menu")
        .setPlaceholder("Chọn một người để treo cổ (60 giây):");
      const votePlayersRow = new ActionRowBuilder().addComponents(
        voteSelectMenu
      );
      const voteMessage = await message.channel.send({
        embeds: [voteEmbed],
        components: [votePlayersRow],
      });

      const filter = (i) => {
        for (let index = 0; index < alivePlayers.length; index++) {
          let player = alivePlayers[index];
          if (player.discord_id == i.user.id) return true;
        }
        return false;
      };
      const collector = voteMessage.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 60000,
      });

      collector.on("collect", async function (i) {
        let coeff = 1;
        if (i.customId != "vote_menu") return;
        await i.deferReply({ ephemeral: true });
        if (!filter(i))
          return i.editReply({
            content: "Bạn không ở trong ván chơi này",
          });
        const votedPlayerId = i.values[0];
        const votedPlayer = await i.guild.members.fetch(votedPlayerId);
        if (playerVotes.get(i.user.id) == votedPlayerId) {
          coeff = -1;
        }
        votes[votedPlayerId] += coeff;

        playerVotes.set(i.user.id, votedPlayerId);

        const voteFields = await Promise.all(
          Object.entries(votes).map(async function (arr) {
            let [discord_id, numOfVotes] = arr;
            let member = await i.guild.members.fetch(discord_id);
            return {
              name: member.displayName,
              value: numOfVotes.toString(),
              inline: true,
            };
          })
        );

        voteEmbed.setFields(voteFields);

        await voteMessage.edit({
          embeds: [voteEmbed],
        });

        await Game.updateOne(
          {
            guild_id: i.guildId,
            thread_id: i.channelId,
          },
          {
            votes: votes,
          }
        );

        return i.editReply(
          `Bạn đã ${coeff > 0 ? "" : "hủy "}chọn ${votedPlayer.displayName}.`
        );
      });
      collector.once("end", async (collect, reason) => {
        if (reason != "time") return;
        await voteMessage.edit({
          components: [],
        });
        await voteMessage.channel.send({
          embeds: [
            new EmbedBuilder()
              .setColor(Colors.Red)
              .setTimestamp()
              .setTitle("Đã hết thời gian bình chọn"),
          ],
        });
        const gameDB = await Game.findOne({
          guild_id: message.guildId,
          thread_id: message.channelId,
        });
        const { votes } = gameDB;

        var hangedPlayers = [];
        let maxVote = Number.MIN_SAFE_INTEGER;
        for (let playerId in votes) {
          if (votes[playerId] > maxVote) maxVote = votes[playerId];
        }
        for (let playerId in votes) {
          if (votes[playerId] == maxVote) hangedPlayers.push(playerId);
        }

        if (maxVote != 0) {
          const diePlayer = hangedPlayers.reduce((a, b) => {
            return Math.random() >= 0.5 ? a : b;
          });
          var diePlayerFields = [];

          const hangedPlayersFields = await Promise.all(
            hangedPlayers.map(async function (playerId) {
              let playerDiscordAccount = await message.guild.members.fetch(
                playerId
              );
              if (playerId == diePlayer) {
                diePlayerFields.push({
                  name: playerDiscordAccount.displayName,
                  value: "\u200B",
                  inline: true,
                });
              }
              return {
                name: playerDiscordAccount.displayName,
                value: "\u200B",
                inline: true,
              };
            })
          );

          const hangedPlayersEmbed = new EmbedBuilder()
            .setTitle("Những người chơi bị đưa lên giàn:")
            .setColor(Colors.Red)
            .setTimestamp()
            .setFields(hangedPlayersFields);

          const diePlayerEmbed = new EmbedBuilder()
            .setTitle("Sau khi chọn ngẫu nhiên người chơi sẽ bị treo cổ là:")
            .setTimestamp()
            .setColor(Colors.Red)
            .setFields(diePlayerFields);

          await message.channel.send({
            embeds: [hangedPlayersEmbed, diePlayerEmbed],
          });

          await Player.kill(diePlayer);
        }
        const endGame = await checkWinCondition(message.channel);

        if (!endGame) await message.channel.send("start_night");
      });
    } catch (err) {
      console.log(err);
    }
  },
};
