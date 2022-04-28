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

  async getChatData() {
    const item = this.data;
    
    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `<img src="${item.img}" width="36" heigh="36"/><h3>${item.name}</h3>`;

    let description = item.data.description ?? '';
    let mods = [];
    let harm = []

    /* if attached to an actor, see if we can find any relevant mod info */
    if (this.actor) {
      if (this.type == 'power') {

        /* construct info about attached flare mods */
        switch (this.data.data.type) {
          case 'active':
            this.data.data.mods.forEach( modId => {
              const mod = this.actor.items.get(modId);
              if (mod) {
                mods.push({name: mod.data.name, img: mod.data.img, description: mod.data.data.description});
              }
            });
            break;
          case 'passive':
          case 'supernova':
            this.actor.data.data.mods.forEach( persistentMod => {
              const mod = this.actor.items.get(persistentMod);
              if (mod?.data.data.affects == this.data.data.type){
                mods.push({name: mod.data.name, img: mod.data.img, description: mod.data.data.description});
              }
            });
            break;
        }

        /* construct info about available Harm */
        harm = this.data.data.harm?.map( harm => harm.name ) ?? [];
      }
    }

    const html = await renderTemplate("systems/nova/templates/dice/item-roll.html", {mods, description, harm});
    

    return {speaker, rollMode, label, description: html}
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {

    const {speaker, rollMode, label, description} = await this.getChatData();

    //send chat message
    return ChatMessage.create({
      speaker: speaker,
      rollMode: rollMode,
      flavor: label,
      content: description
    });
  }

  _getHarm(identifier) {

    /* if handed a string, try to parse as a number */
    let index = parseInt(identifier);

    if(isNaN(index)) {
      ui.notifications.error('Could not locate harm by index');
      return false;
    }

    /* accounting for 1.0 -> 1.1 migration where harm was added
     * to items */
    const currentHarm = this.data.data.harm ?? [];

    if(index > currentHarm.length) {
      ui.notifications.error('Invalid harm index provided');
      return false;
    }

    return {
      index,
      _harmSource: currentHarm,
      get harmArray() {
        return deepClone(this._harmSource);
      }
    }
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

    const harmInfo = this._getHarm(identifier);
    if(!harmInfo) return false;

    let currentHarm = harmInfo.harmArray;

    currentHarm.splice(harmInfo.index,1);
    await this.update({'data.harm': currentHarm})
  }

  async updateHarm(identifier, harmData) {

    const harmInfo = this._getHarm(identifier);
    if(!harmInfo) return false;

    let currentHarm = harmInfo.harmArray;

    mergeObject(currentHarm[harmInfo.index], harmData);
    await this.update({'data.harm': currentHarm})
  }
}
