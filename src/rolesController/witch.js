const { nightFunctionCollector } = require("../frameworks/collector");
const { roleValidation } = require("../frameworks/valid");
const {
  Colors,
  StringSelectMenuInteraction,
  EmbedBuilder,
  ThreadChannel,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ComponentType,
  ButtonInteraction,
} = require("discord.js");
const Game = require("../models/game");
const Player = require("../models/player");

/**
 *
 * @param {StringSelectMenuInteraction} i
 */
async function poisonCollectFunction(i) {
  try {
    await i.deferReply({
      ephemeral: true,
    });
    if (!(await roleValidation(i.channel, i.user.id, "witch")))
      return i.editReply({
        content: "Bạn không thể thực hiện chức năng này",
        ephemeral: true,
      });
    let game = await Game.findOne({ thread_id: i.channelId });
    let poisonedDiscord = await i.guild.members.fetch(i.values[0]);
    let poisonedPlayer = await Player.findOne({
      discord_id: poisonedDiscord.id,
    });
    game.witch_poison = i.values[0];
    game.kills_in_night.push(poisonedPlayer._id);
    poisonedPlayer.alive = false;
    await game.save();
    await poisonedPlayer.save();
    await i.editReply(
      `Bạn đã quăng bình độc để giết ${poisonedDiscord.displayName}`
    );
    await i.channel.send({
      embeds: [
        new EmbedBuilder()
          .setColor(Colors.Red)
          .setTimestamp()
          .setTitle(`Phù thủy đã đầu độc ${poisonedDiscord.displayName}`),
      ],
    });
  } catch (err) {
    console.log(err);
  }
}

module.exports = {
  /**
   *
   * @param {ThreadChannel} gameThread
   */
  async nightExecute(gameThread) {
    try {
      let game = await Game.findOne({ thread_id: gameThread.id });
      if (game.day_index != 1) return;
      if (!game.witch_poison) {
        await nightFunctionCollector(
          gameThread,
          "Dân làng còn sống: ",
          "Phù thủy có muốn dùng bình độc với ai không?",
          "poison_menu",
          Colors.Purple,
          poisonCollectFunction,
          null,
          10,
          "phù thủy"
        );
      }
      if (!game.witch_heal && game.kills_in_night.length > 0) {
        let lastDiePlayerDiscord = await gameThread.guild.members.fetch(
          game.kills_in_night[0]
        );
        let witch = await Player.findOne({
          game_id: game._id,
          role: "witch",
        });
        let witchDiscord = await gameThread.guild.members.fetch(
          witch.discord_id
        );
        const healEmbed = new EmbedBuilder()
          .setTitle(
            `Đêm qua ${lastDiePlayerDiscord.displayName} đã bị giết, phù thủy có muốn cứu không?`
          )
          .setColor(Colors.Purple)
          .setTimestamp();
        const healButton = new ButtonBuilder()
          .setCustomId("witch_heal_button")
          .setLabel("Cứu")
          .setStyle(ButtonStyle.Success);
        const rejectButton = new ButtonBuilder()
          .setCustomId("witch_reject_button")
          .setLabel("Bỏ qua")
          .setStyle(ButtonStyle.Danger);
        const decisionRow = new ActionRowBuilder().addComponents([
          rejectButton,
          healButton,
        ]);
        const decisionMess = await witchDiscord.send({
          embeds: [healEmbed],
          components: [decisionRow],
        });
        const collector = decisionMess.createMessageComponentCollector({
          componentType: ComponentType.Button,
          time: 10000,
        });

        collector.on(
          "collect",
          /**
           *
           * @param {ButtonInteraction} i
           */
          async function (i) {
            try {
              await i.deferReply({ ephemeral: true });
              switch (i.customId) {
                case "witch_heal_button": {
                  let game = await Game.findOne({
                    thread_id: gameThread.id,
                  }).populate("kills_in_night");
                  let healedPlayer = await Player.findOne({
                    discord_id: game.kills_in_night[0].discord_id,
                  });
                  let healedDiscord = await i.guild.members.fetch(
                    healedPlayer.discord_id
                  );
                  healedPlayer.alive = true;
                  game.witch_heal = healedPlayer.discord_id;
                  await healedPlayer.save();
                  await game.save();
                  await gameThread.send({
                    embeds: [
                      new EmbedBuilder()
                        .setColor(Colors.Green)
                        .setTitle(
                          `Phù thủy đã cứu ${healedDiscord.displayName}`
                        )
                        .setTimestamp(),
                    ],
                  });
                }
                default: {
                  await i.message.edit({
                    components: [],
                  });
                }
              }
              await i.editReply("Đã ghi nhận hành động");
            } catch (err) {
              console.log(err);
            }
          }
        );
        await wait(10000);
      }
    } catch (err) {
      console.log(err);
    }
  },
};
