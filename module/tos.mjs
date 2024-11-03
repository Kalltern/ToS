// Import document classes.
import { ToSActor } from "./documents/actor.mjs";
import { ToSItem } from "./documents/item.mjs";
// Import sheet classes.
import { ToSActorSheet } from "./sheets/actor-sheet.mjs";
import { ToSItemSheet } from "./sheets/item-sheet.mjs";
// Import helper/utility classes and constants.
import { TOS } from "./helpers/config.mjs";

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

// Add key classes to the global scope so they can be more easily used
// by downstream developers
globalThis.tos = {
  documents: {
    ToSActor,
    ToSItem,
  },
  applications: {
    ToSActorSheet,
    ToSItemSheet,
  },
  utils: {
    rollItemMacro,
  },
};

Hooks.once("init", function () {
  // Add custom constants for configuration.
  CONFIG.TOS = TOS;

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "1d12+5",
    decimals: 0,
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = ToSActor;
  CONFIG.Item.documentClass = ToSItem;

  // Active Effects are never copied to the Actor,
  // but will still apply to the Actor from within the Item
  // if the transfer property on the Active Effect is true.
  CONFIG.ActiveEffect.legacyTransferral = false;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("tos", ToSActorSheet, {
    makeDefault: true,
    label: "TOS.SheetLabels.Actor",
  });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("tos", ToSItemSheet, {
    makeDefault: true,
    label: "TOS.SheetLabels.Item",
  });
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here is a useful example:
Handlebars.registerHelper("toLowerCase", function (str) {
  return str.toLowerCase();
});

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */

Hooks.once("ready", function () {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createDocMacro(data, slot));
});

/* -------------------------------------------- */
/*  Hotbar Macros                               */
/* -------------------------------------------- */

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {Object} data     The dropped data
 * @param {number} slot     The hotbar slot to use
 * @returns {Promise}
 */
async function createDocMacro(data, slot) {
  // First, determine if this is a valid owned item.
  if (data.type !== "Item") return;
  if (!data.uuid.includes("Actor.") && !data.uuid.includes("Token.")) {
    return ui.notifications.warn(
      "You can only create macro buttons for owned Items"
    );
  }
  // If it is, retrieve it based on the uuid.
  const item = await Item.fromDropData(data);

  // Create the macro command using the uuid.
  const command = `game.tos.rollItemMacro("${data.uuid}");`;
  let macro = game.macros.find(
    (m) => m.name === item.name && m.command === command
  );
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "tos.itemMacro": true },
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemUuid
 */
function rollItemMacro(itemUuid) {
  // Reconstruct the drop data so that we can load the item.
  const dropData = {
    type: "Item",
    uuid: itemUuid,
  };
  // Load the item from the uuid.
  Item.fromDropData(dropData).then((item) => {
    // Determine if the item loaded and if it's an owned item.
    if (!item || !item.parent) {
      const itemName = item?.name ?? itemUuid;
      return ui.notifications.warn(
        `Could not find item ${itemName}. You may need to delete and recreate this macro.`
      );
    }

    // Trigger the item roll
    item.roll();
  });
}
Hooks.on("renderChatMessage", (message, html, data) => {
  // Check if the current user is the one who made the roll
  if (game.user.id === message.author.id) {
    // Add logic to check if the message is a roll message
    if (message.content.includes("rolled") || message.rolls.length > 0) {
      // Create a reroll button element
      const rerollButton = $(
        '<button class="d100-reroll-button">Re-Roll</button>'
      );

      // Append the reroll button to the chat message
      html.find(".message-content").append(rerollButton);

      // Add click event listener for the reroll button
      rerollButton.on("click", async (event) => {
        event.preventDefault();
        console.log("Re-roll button clicked");

        // Call your reroll logic here
        const rollFormula = message.rolls[0].formula;
        const roll = new Roll(rollFormula);
        await roll.evaluate();

        // Send the new roll to chat or update the message as needed
        roll.toMessage({
          speaker: ChatMessage.getSpeaker({ user: game.user }),
          flavor: `[Re-Roll] ${message.flavor}`,
        });
      });
    }
  }
});
