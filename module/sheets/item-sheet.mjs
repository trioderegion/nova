/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class NovaItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["nova", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/nova/templates/item";
    
    // Return a single sheet for all item types.
    return `${path}/item-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item.data;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    context.modInfo = {
      "None": "",
    }

    /* insert the appropriate item sub-type */
    context.subTypes = {'flare': CONFIG.NOVA.flareType,
                               'power': CONFIG.NOVA.powerType}[itemData.type]

    context.canAttachFlare = false;

    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
      
      /* need an actor to grab any possible flare mods to attach */
      if(itemData.data.type == 'active') {
        const compatibleMods = actor.items.filter( item => item.type == 'flare' && item.data.data.type == 'power' )

        /* populate information for display */
        compatibleMods.forEach( (mod) => {
          context.modInfo[mod.name] = mod.id;
        });

        context.canAttachFlare = true;
      }
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = itemData.data;
    context.flags = itemData.flags;

    context.config = CONFIG.NOVA;
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Roll handlers, click handlers, etc. would go here.
  }
}
