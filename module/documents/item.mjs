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
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    rollData.item = foundry.utils.deepClone(this.data.data);

    return rollData;
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    const item = this.data;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    let content = item.data.description ?? '';

    /* if attached to an actor, see if we can find any relevant mod info */
    if (this.actor) {
      if (this.type == 'power') {
        switch (this.data.data.type) {
          
          case 'active':
            this.data.data.mods.forEach( modId => {
              const mod = this.actor.items.get(modId);
              if (mod) {
                content += `<hr/>${mod.data.data.description}`
              }
            });
            break;
          case 'passive':
          case 'supernova':
            this.actor.data.data.mods.forEach( persistentMod => {
              const mod = this.actor.items.get(persistentMod);
              if (mod?.data.data.affects == this.data.data.type){
                content += `<hr/>${mod.data.data.description}`
              }
            });
            break;
        }
      }
    }

    // If there's no roll data, send a chat message.
    if (!this.data.data.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData)
      return roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
    }
  }
}
