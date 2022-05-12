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
    context.canBeAttached = false;


    let actor = this.object?.parent ?? null;

      /* need an actor to grab any possible flare mods to attach */
      switch (itemData.type) {

        //case 'active':
        //case 'passive':
        case 'power': {
          context.canAttachFlare = !!actor && itemData.data.type == 'active';
          context.configLabel = "NOVA.Harm.Label";

          if(actor) {
            /* collect all flare mods that we could attach to a power (i.e. not persistant and not already in use) */
            const compatibleMods = actor.items.filter( item => item.type == 'flare' && item.data.data.type == 'power' 
              && (item.data.data.affects == 'any' || item.data.data.affects == context.item.id) )

            /* populate information for display */
            compatibleMods.forEach( (mod) => {
              context.modInfo[mod.id] = mod.name;
            });
          }

          break;
        }

        case 'flare':

          context.canBeAttached = true;
          context.configLabel = "NOVA.Modifications";
          context.affectInfo = this._createAffectsOptions();

          /* populate available change targets, modes, expressions */
          context.flareChanges = this._createChangeOptions();

          break;
        
      }


    // Add the actor's data to context.data for easier access, as well as flags.
    context.rollData = this.object.getRollData();
    context.data = duplicate(itemData.data);
    context.flags = duplicate(itemData.flags);

    context.config = CONFIG.NOVA;
    return context;
  }

  _createChangeOptions() {
    switch (this.object.data.data.type) {
      case 'persistent':

        if (this.object.data.data.affects == 'spark') {
          /* this mod affects the sparks stats directly */
          return {
            mode: CONFIG.NOVA.changeModes,
            targets: CONFIG.NOVA.persistTargets
          }
        }

          /* this mod is effectively a "power" mod
           * fallthrough to power case
           */
      case 'power':
        return {
          mode: CONFIG.NOVA.changeModes,
          targets: CONFIG.NOVA.modTargets
        }
    }

  }

  _createAffectsOptions() {
    
    let affectInfo = {};

    switch (this.object.data.data.type) {
      case 'power' :
        /* can affect [any power, specific power] */
        affectInfo = {'none': game.i18n.localize('NOVA.None'), 'any': game.i18n.localize('NOVA.Any')};

        if (this.object.actor) {
          /* collect all powers attached to the parent actor */
          const powers = this.object.actor.items.filter( item => item.type == 'power' && item.data.data.type == 'active' );
          powers.forEach( power => {
            affectInfo[power.id] = power.name;
          })
        }

        break;

      default:
          /* can affect [spark, passive power, supernova power] */
          affectInfo = {'spark': game.i18n.localize('NOVA.Spark'), 'passive': game.i18n.localize('NOVA.PowerPassive'), 'supernova': game.i18n.localize('NOVA.PowerSupernova')};
    }

    return affectInfo;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    /* Harm Entry Management */
    html.find(".effect-control").click(ev => this._onManageEntry(ev));
    html.find(".change-field").change( ev => this._onEditChange(ev) );
  }

  async _onManageEntry(event) {
    event.preventDefault();
    const header = event.currentTarget;
    const category = header.closest('ol')?.dataset.category ?? false;

    if(!category) return;

    const action = header.dataset.action;

    switch(category) {
      case 'active':
      case 'passive':
      case 'supernova': {
        const index = Number(header.dataset.harmIndex);
        return this._onManageHarm(action, index);
      }
      case 'persistent':
      case 'power': {
        const index = Number(header.dataset.changeIndex);
        return this._onManageChange(action, index);
      }
    }
    
  }

  async _onManageHarm(action, index) {
    switch (action) {
      case 'create':
        await this.object.addHarm(CONFIG.NOVA.DEFAULTS.HARM_DATA);
        index = this.object.data.data.harm.length-1;
      case 'edit':
        const harmData = await HarmConfig.create(this.object, this.object.data.data.harm[index] );
        if(!harmData) return;
        return this.object.updateHarm(index, harmData);
      case 'delete':
        return this.object.deleteHarm(index);
    }
  }

  async _onManageChange(action, index) {
    switch (action) {
      case 'create': 
        return this.object.addChange(CONFIG.NOVA.DEFAULTS.CHANGE_DATA);
      case 'delete':
        return this.object.deleteChange(index);
    }
  }

  async _onEditChange(event) {
    event.preventDefault(); 

    const element = event.currentTarget;
    const listRow = element.closest('li');

    const index = listRow.dataset.changeIndex;

    /* get this update data */
    const field = element.dataset.field;
    let value = element.value;
    if(element.dataset.dtype == "Number") value = Number(value);

    return this.object.updateChange(index, {[field]: value});

  }
}
