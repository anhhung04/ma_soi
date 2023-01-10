const timers = new Map();
const prefixes = new Map();
const default_prefix = require("../config.json")["default_prefix"];
const fs = require("node:fs");
const { Collection, Message } = require("discord.js");
const { timeLimitMessageCreate } = require("../config.json");
const commands = new Collection();
const commandFiles = fs
  .readdirSync("./src/commands")
  .filter((file) => file.endsWith(".js"));

for (let file of commandFiles) {
  if (!file) continue;
  let command = require(`../commands/${file}`);
  commands.set(command.name, command);
}

function check_aliases(commandName) {
  let aliasesName;

  for (let [name, command] of commands) {
    if (command.aliases?.includes(commandName)) {
      aliasesName = name;
      break;
    }
  }

  return aliasesName;
}

module.exports = {
  name: "messageCreate",
  /**
   *
   * @param {Message} message
   * @returns
   */
  async execute(message) {
    let timestamp = message.createdTimestamp;
    let time_limit = timeLimitMessageCreate * 1000;
    let last_timestamp = timers.get(message.author.id) || 0;
    let diff = timestamp - last_timestamp;
    let prefix = prefixes.get(message.guildId) || default_prefix;

    if (message.client.user.id == message.author.id) {
      message.content = prefix + message.content;
    } else if (!message.content.startsWith(prefix) || message.author.bot)
      return;

    if (!message.author.bot) {
      if (diff < time_limit) {
        let left_sec = Math.floor((time_limit - diff) / 1000);
        return message.channel.send(`Hãy chờ thêm ${left_sec} giây!`);
      }

      timers.set(message.author.id, Date.now());
    }
    let [commandName, ...args] = message.content
      .slice(prefix.length)
      .split(/\s+/);
    args = args.join(" ");
    let command = commands.get(commandName);

    if (!command) {
      let aliasesCommand = check_aliases(commandName);

      if (!check_aliases) return message.channel.send("Invalid command!");

      command = commands.get(aliasesCommand);
    }

    return command?.execute(message, args);
  },
};
