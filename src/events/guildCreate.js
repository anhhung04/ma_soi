const deploySlashCommand = require('../deploy-slash-command.js');

module.exports = {
    name: "guildCreate",
    async execute(guild){
        console.log(`Joined ${guild.name} at ${Date.now()}`);
        return deploySlashCommand(guild.id);
    }
}