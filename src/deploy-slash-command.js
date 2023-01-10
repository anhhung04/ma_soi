const fs = require('node:fs');
const { REST } = require('@discordjs/rest');
const { Routes } = require('discord.js');
const { client_id} = require('./config.json');
require('dotenv').config();
const token = process.env.TOKEN||require('./config.json')["TOKEN"];

const commands = [];
const commandFiles = fs.readdirSync('./src/interaction_handlers/slash_commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const command = require(`./interaction_handlers/slash_commands/${file}`);
	commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(token);
module.exports= async (guild_id) => {
	try {

		console.log('Started refreshing application (/) commands.', guild_id);

		if(!commands) return;

		await rest.put(Routes.applicationGuildCommands(client_id, guild_id), { body: commands })
        .then(() => console.log('Successfully registered application commands.'))
        .catch(console.error);

		console.log('Successfully reloaded application (/) commands.', guild_id);
	} catch (error) {
		console.error(error);
	}
}    


    