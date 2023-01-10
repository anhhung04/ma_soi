const { InteractionType, Collection, ComponentType } = require("discord.js");
const fs = require("node:fs");

const slash_commands = new Collection();
const slashCommandFiles = fs
  .readdirSync("./src/interaction_handlers/slash_commands")
  .filter((file) => file.endsWith(".js"));

for (let file of slashCommandFiles) {
  if (!file) continue;
  let slash_command = require(`./slash_commands/${file}`);
  slash_commands.set(slash_command.data.name, slash_command);
}

const buttons = new Collection();
const buttonFiles = fs
  .readdirSync("./src/interaction_handlers/buttons")
  .filter((file) => file.endsWith(".js"));

for (let file of buttonFiles) {
  if (!file) continue;
  let button = require(`./buttons/${file}`);
  buttons.set(button.name, button);
}

const modals = new Collection();
const modalFiles = fs
  .readdirSync("./src/interaction_handlers/modals")
  .filter((file) => file.endsWith(".js"));

for (let file of modalFiles) {
  if (!file) continue;
  let modal = require(`./modals/${file}`);
  modals.set(modal.name, modal);
}

const select_menus = new Collection();
const selectMenuFiles = fs
  .readdirSync("./src/interaction_handlers/select_menus")
  .filter((file) => file.endsWith(".js"));

for (let file of selectMenuFiles) {
  if (!file) continue;
  let select_menu = require(`./select_menus/${file}`);
  select_menus.set(select_menu.name, select_menu);
}

module.exports = async function (interaction) {
  let type = interaction.type;
  let commandName = interaction.commandName;
  let customId = interaction.customId;

  switch (type) {
    case InteractionType.ApplicationCommand: {
      let command = slash_commands.get(commandName);

      return command?.execute(interaction);
    }
    case InteractionType.ModalSubmit: {
      let modal = modals.get(customId);

      return modal?.execute(interaction);
    }
    case InteractionType.MessageComponent: {
      switch (interaction.componentType) {
        case ComponentType.Button: {
          let button = buttons.get(customId);

          return button?.execute(interaction);
        }
        case ComponentType.SelectMenu: {
          let select_menu = select_menus.get(customId);

          return select_menu?.execute(interaction);
        }
      }
    }
  }
};
