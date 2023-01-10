const fs = require("node:fs");
const { ButtonBuilder, ButtonStyle } = require("discord.js");
var rolesButton = [];
const rolesMap = new Map();

const roleFiles = fs
  .readdirSync("./src/data/rolesData")
  .filter((f) => f.endsWith(".json"));

roleFiles.forEach((file) => {
  let role = require(`./${file}`);
  let roleId = file.slice(0, file.length - ".json".length);
  rolesMap.set(roleId, role);
  rolesButton.push(
    new ButtonBuilder()
      .setCustomId(roleId)
      .setStyle(ButtonStyle.Primary)
      .setLabel(role.name)
  );
});

module.exports = {
  rolesButton: rolesButton,
  rolesMap: rolesMap,
};
