import { NOVA } from '../helpers/config.mjs'

const ItemData = foundry.data.ItemData;

class NovaItemData extends ItemData {

  static defineSchema() {
    let schema = super.defineSchema();
    schema.img.default = (data) => this.DEFAULT_ICON[data.type];
    return schema;
  }

  static DEFAULT_ICON = {
    power: 'icons/magic/symbols/symbol-lightning-bolt.webp',
    flare: 'icons/magic/symbols/cog-glowing-green.webp'
  }
}

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class NovaItem extends Item {

  static get schema() {
    return NovaItemData;
  }

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    let rollData = {};
    
    // If present, return the actor's roll data.
    if ( this.actor ) rollData = this.actor.getRollData();

    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  getChatData() {
    const item = this.data;
    
    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `<img src="${item.img}" width="36" heigh="36"/><h3>${item.name}</h3>`;

    let description = item.data.description ?? '';

    const content = (mod) => {
      return `<hr/><div class="flexrow attached-mod"><div class="mod-icon flexrow"><img name="perImg" src="${mod.data.img}"/>${mod.name}</div> ${mod.data.data.description}</div>`;
    }

    /* if attached to an actor, see if we can find any relevant mod info */
    if (this.actor) {
      if (this.type == 'power') {

        switch (this.data.data.type) {
          case 'active':
            this.data.data.mods.forEach( modId => {
              const mod = this.actor.items.get(modId);
              if (mod) {
                description += content(mod);
              }
            });
            break;
          case 'passive':
          case 'supernova':
            this.actor.data.data.mods.forEach( persistentMod => {
              const mod = this.actor.items.get(persistentMod);
              if (mod?.data.data.affects == this.data.data.type){
                description += content(mod);
              }
            });
            break;
        }
      }
    }

    return {speaker, rollMode, label, description}
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {

    const {speaker, rollMode, label, description} = this.getChatData();

    //send chat message
    return ChatMessage.create({
      speaker: speaker,
      rollMode: rollMode,
      flavor: label,
      content: description
    });
  }

  /** 
   * Handle adding new harm data
   */
  async addHarm(harmData = CONFIG.NOVA.DEFAULTS.HARM_DATA){

    /* accounting for 1.0 -> 1.1 migration where harm was added
     * to items */
    const currentHarm = this.data.data.harm ?? [];

    const updatedHarm = currentHarm.concat([harmData]); 
    await this.update({'data.harm': updatedHarm});
  }

  /**
   * Handle deleting harm data
   * @param {String|Number} name or index
   */
  async deleteHarm(identifier) {
    
    /* if handed a string, try to parse as a number */
    let index = parseInt(identifier);

    if(isNaN(index)) {
      ui.notifications.error('Could not locate harm by index');
      return;
    }

    /* accounting for 1.0 -> 1.1 migration where harm was added
     * to items */
    let currentHarm = deepClone(this.data.data.harm) ?? [];

    if(index > currentHarm.length) {
      ui.notifications.error('Invalid harm index provided for removal');
      return;
    }

    currentHarm.splice(index,1);
    await this.update({'data.harm': currentHarm})
  }
}
