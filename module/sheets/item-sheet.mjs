import { HarmConfig } from '../ui/harm-config.mjs'

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class NovaItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["nova", "sheet", "item"],
      template: "systems/nova/templates/item/item-sheet.html",
      width: 520,
      height: 480,
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
      "": game.i18n.localize("NOVA.None"),
    }

    /* insert the appropriate item sub-type */
    context.subTypes = {'flare': CONFIG.NOVA.flareType,
      'power': CONFIG.NOVA.powerType}[itemData.type]

    context.canAttachFlare = false;


    let actor = this.object?.parent ?? null;
    if (actor) {

      /* need an actor to grab any possible flare mods to attach */
      switch (itemData.data.type) {
        case 'active': {
          context.canAttachFlare = true;

          /* collect all flare mods that we could attach to a power (i.e. not persistant and not already in use) */
          const compatibleMods = actor.items.filter( item => item.type == 'flare' && item.data.data.type == 'power' 
            && (item.data.data.affects == 'any' || item.data.data.affects == context.item.id) )

          /* populate information for display */
          compatibleMods.forEach( (mod) => {
            context.modInfo[mod.id] = mod.name;
          });

          break;
        }
        case 'flare': {

          /* populate 'affects' selection based on type */
          switch (itemData.data.type){
            case 'persistent':
              /* can affect [spark, passive power, supernova power] */
              context.affectInfo = {'spark': game.i18n.localize('NOVA.Spark'), 'passive': game.i18n.localize('NOVA.PowerPassive'), 'supernova': game.i18n.localize('NOVA.PowerSupernova')};
              break;
            case 'power':
              /* can affect [any power, specific power] */
              context.affectInfo = {'none': game.i18n.localize('NOVA.None'), 'any': game.i18n.localize('NOVA.Any')};

              /* collect all powers attached to the parent actor */
              const powers = actor.items.filter( item => item.type == 'power' && item.data.data.type == 'active' );
              powers.forEach( power => {
                context.affectInfo[power.id] = power.name;
              })
              break;
          }
          break;
        }
        default: break;
      }


    }
    // Add the actor's data to context.data for easier access, as well as flags.
    context.rollData = this.object.getRollData();
    context.data = duplicate(itemData.data);
    context.flags = duplicate(itemData.flags);

    context.config = CONFIG.NOVA;
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    /* Harm Entry Management */
    html.find(".effect-control").click(ev => this._onManageHarm(ev));
  }

  async _onManageHarm(event) {
    event.preventDefault();
    const header = event.currentTarget;

    const action = header.dataset.action;
    let index = header.dataset.harmIndex;

    switch (action) {
      case 'create':
        await this.object.addHarm(CONFIG.NOVA.DEFAULTS.HARM_DATA);
        index = this.object.data.data.harm.length-1;
      case 'edit':
        HarmConfig.create(this.object, this.object.data.data.harm[index] );
        break;
      case 'delete':
        await this.object.deleteHarm(index);
        break;
    }
  }
}
