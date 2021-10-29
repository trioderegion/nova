/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
 export const preloadHandlebarsTemplates = async function() {
  return loadTemplates([

    // Actor partials.
    "systems/nova/templates/actor/parts/actor-flare.html",
    "systems/nova/templates/actor/parts/actor-effects.html",
    "systems/nova/templates/actor/parts/actor-powers.html",
  ]);
};
