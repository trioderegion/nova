// Import document classes.
import { NovaActor } from "./documents/actor.mjs";
import { NovaItem } from "./documents/item.mjs";
import { NovaCombat } from './documents/combat.mjs';
import { NovaCombatant } from './documents/combatant.mjs';

// Import sheet classes.
import { NovaActorSheet } from "./sheets/actor-sheet.mjs";
import { NovaItemSheet } from "./sheets/item-sheet.mjs";

// Import helper/utility classes and constants.
import { preloadHandlebarsTemplates } from "./helpers/templates.mjs";
import { NOVA, statusEffects } from "./helpers/config.mjs";
import { DropRoll, NovaRoll } from "./helpers/dice.mjs";

// Import UI Classes
import { NovaCombatTracker } from './ui/combat-tracker.mjs'

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */

Hooks.once('init', async function() {

  // Add utility classes to the global game object so that they're more easily
  // accessible in global contexts.
  game.nova = {
    NovaActor,
    NovaItem,
    rollItemMacro,
    DropRoll,
    NovaRoll,
  };

  // Add custom constants for configuration.
  CONFIG.NOVA = NOVA;


  // Add custom status effects after translations are ready
  Hooks.once('setup', () => {
    CONFIG.statusEffects = statusEffects.sort( (left, right) => {
      const a = game.i18n.localize(left.label);
      const b = game.i18n.localize(right.label);
      if (a < b) return -1;
      if (a > b) return 1;
      return 0;
    });
  });

  /**
   * Set an initiative formula for the system
   * @type {String}
   */
  CONFIG.Combat.initiative = {
    formula: "0",
    decimals: 0
  };

  // Define custom Document classes
  CONFIG.Actor.documentClass = NovaActor;
  CONFIG.Item.documentClass = NovaItem;
  CONFIG.Dice.rolls.push(NovaRoll);
  CONFIG.Dice.rolls.push(DropRoll);
  CONFIG.Combatant.documentClass = NovaCombatant;
  CONFIG.Combat.documentClass = NovaCombat;

  // Define custom UI classes
  CONFIG.ui.combat = NovaCombatTracker;

  // Register sheet application classes
  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("nova", NovaActorSheet, { makeDefault: true, label: 'NOVA.SheetClass' });
  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("nova", NovaItemSheet, { makeDefault: true, label: 'NOVA.SheetClass' });

  /*************
  * init hooks 
  *************/

  /* chat log listeners */
  Hooks.on('renderChatLog', (app, html) => {
    DropRoll._claimListener(html);
    NovaItem._chatListeners(html);
  });

  /* drop claim message monitor and drop message modifier */
  Hooks.on('createChatMessage', (msg) => {
    DropRoll._updateClaimed(msg)
  });
  
  // Preload Handlebars templates.
  return preloadHandlebarsTemplates();
});

/* -------------------------------------------- */
/*  Handlebars Helpers                          */
/* -------------------------------------------- */

// If you need to add Handlebars helpers, here are a few useful examples:
Handlebars.registerHelper('concat', function() {
  var outStr = '';
  for (var arg in arguments) {
    if (typeof arguments[arg] != 'object') {
      outStr += arguments[arg];
    }
  }
  return outStr;
});

Handlebars.registerHelper('toLowerCase', function(str) {
  return str.toLowerCase();
});

Handlebars.registerHelper('imgFromId', function(collection, id) {
  const result = collection.find( entry => entry.id === id )
  if (result) {
    return result.img
  }

  return null;
});

Handlebars.registerHelper('novaNameFromId', function(collection, id) {
  const result = collection.find( entry => entry.id === id )
  if (result) {
    return result.name;
  }

  return null;
});

Handlebars.registerHelper('novaNullOrEmpty', function(element) {
  return element == undefined || element == '';
});


Handlebars.registerHelper('descFromId', function(collection, id) {
  const result = collection.find( entry => entry.id === id )
  if (result) {
    return result.description;
  }

  return null;
});

Handlebars.registerHelper('novaLookup', function (object, propertyName, defaultValue, options) {
    const result = options.lookupProperty(object, propertyName)
    if (result != null) {
        return result
    }
    return defaultValue
})

/* -------------------------------------------- */
/*  Ready Hook                                  */
/* -------------------------------------------- */
Hooks.once("ready", async function() {
  // Wait to register hotbar drop hook on ready so that modules could register earlier if they want to
  Hooks.on("hotbarDrop", (bar, data, slot) => createItemMacro(data, slot));
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
async function createItemMacro(data, slot) {
  if (data.type !== "Item") return;
  if (!("data" in data)) return ui.notifications.warn("You can only create macro buttons for owned Items");
  const item = data.data;

  // Create the macro command
  const command = `game.nova.rollItemMacro("${item.name}");`;
  let macro = game.macros.entities.find(m => (m.name === item.name) && (m.command === command));
  if (!macro) {
    macro = await Macro.create({
      name: item.name,
      type: "script",
      img: item.img,
      command: command,
      flags: { "nova.itemMacro": true }
    });
  }
  game.user.assignHotbarMacro(macro, slot);
  return false;
}

/**
 * Create a Macro from an Item drop.
 * Get an existing item macro if one exists, otherwise create a new one.
 * @param {string} itemName
 * @return {Promise}
 */
function rollItemMacro(itemName) {
  const speaker = ChatMessage.getSpeaker();
  let actor;
  if (speaker.token) actor = game.actors.tokens[speaker.token];
  if (!actor) actor = game.actors.get(speaker.actor);
  const item = actor ? actor.items.find(i => i.name === itemName) : null;
  if (!item) return ui.notifications.warn(`Your controlled Actor does not have an item named ${itemName}`);

  // Trigger the item roll
  return item.roll();
}
