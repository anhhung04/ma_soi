const deploySlashCommand = require("../deploy-slash-command.js");
const testSeverId = process.env.TEST_GUILD_ID;
module.exports = {
  name: "ready",
  once: true,
  execute(client) {
    console.log(`Ready! Logged in as ${client.user.tag}`);
    const guildTestId = testSeverId;
    deploySlashCommand(guildTestId);
  },
};
