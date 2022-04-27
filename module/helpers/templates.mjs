/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([
    "systems/nova/templates/actor/parts/actor-flare.html",
    "systems/nova/templates/actor/parts/actor-effects.html",
    "systems/nova/templates/actor/parts/actor-powers.html",
    "systems/nova/templates/actor/parts/npc-attributes.html",
    "systems/nova/templates/actor/parts/npc-actions.html",
    "systems/nova/templates/item/parts/header.html",
    "systems/nova/templates/item/parts/config-power.html",
    "systems/nova/templates/item/parts/config-flare.html",
    "systems/nova/templates/item/apps/harm-config.html"
  ]);
};
