import { MODULE } from '../helpers/module.mjs'

export async function attributeRoll(attribute, actor = undefined, {createMsg = true, bonusDie = 0} = {}) {

  const rollData = actor?.getRollData() ?? {};
  let attributeData = {};

  if (typeof attribute == 'number') attributeData = {value: attribute, bonus: 0, total: attribute};
  else attributeData = getProperty(rollData.attributes ?? {}, attribute) ?? {value: 0, bonus: 0, total: 0};

  const rollString = bonusDie == 0 ? `${attributeData.total}d6kh` : `(${attributeData.total} + ${bonusDie})d6kh`;
  const roll = await (new game.nova.NovaRoll(rollString, rollData ).evaluate({async:true}));

  if (createMsg) {
    await roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor }),
      flavor: attributeData.label,
      rollMode: game.settings.get('core', 'rollMode'),
    });
  }

  return roll;

}

export function npcRoll(index, actor, actionList, rollFlavor) {
  index = index ?? false;
  let content = '';

  /* this may be just a raw roll that
   * is not derived from a list */
  if (index !== false) {
    content = actionList[index];
  } else {
    content = actionList;
  }

  return npcRollMessage(content, rollFlavor, ChatMessage.getSpeaker({ actor }) );
}

function npcRollMessage(content, flavor, speaker){
  return ChatMessage.create({
    content,
    flavor,
    speaker
  });
}

const novaChatData = async (roll, chatOptions) => {
  const isPrivate = chatOptions.isPrivate;
  return{
    formula: isPrivate ? "???" : roll._formula,
    flavor: isPrivate ? null : chatOptions.flavor,
    user: chatOptions.user,
    tooltip: isPrivate ? "" : await roll.getTooltip(),
    //total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
    result: isPrivate ? "?" : roll.result,
    drop: {hasDrop: false},
    claimed: roll.claimed,
  }
}

export class DropRoll extends Roll {
  constructor(...args) {
    super(...args);
    this.claimed = false;
  }

  get result() {
    if (this.total < 3) return game.i18n.localize(CONFIG.NOVA.drops.none);
    if (this.total < 6) return game.i18n.format(CONFIG.NOVA.drops.fuel, {quantity: 1});
    return game.i18n.format(CONFIG.NOVA.drops.health, {quantity: 1});
  }

  get dropType() {
    if (this.total < 3) return 'none';
    if (this.total < 6) return 'fuel';
    return 'health';
  }

  /**
   * Render a DropRoll instance to HTML
   * @param {object} [chatOptions]      An object configuring the behavior of the resulting chat message.
   * @return {Promise<string>}          The rendered HTML template as a string
   */
  async render(chatOptions={}) {
    chatOptions = foundry.utils.mergeObject({
      user: game.user.id,
      flavor: null,
      template: this.constructor.CHAT_TEMPLATE,
      blind: false
    }, chatOptions);

    // Execute the roll, if needed
    if (!this._evaluated) this.evaluate();

    // Define chat data
    let chatData = await novaChatData(this, chatOptions);
    chatData.drop = {
      hasDrop: this.total > 2,
      dropType: this.dropType,
      dropCount: 1
    }

    // Render the roll display template
    return renderTemplate(chatOptions.template, chatData);
  }

  static CHAT_TEMPLATE = 'systems/nova/templates/dice/roll.html'

  /* @override */
  static fromData(data) {
    //let roll = super.constructor.fromData(data);
    let roll = super.fromData(data);

    /* insert our custom field */
    roll.claimed = data.claimed;

    return roll;
  }

  /* @override */
  toJSON() {
    let data = super.toJSON();
    data.claimed = this.claimed;
    return data;
  }

  static _claimListener(html) {
    html.on("click", ".drop-button", this._handleClaim.bind(this)); 
    html.on("contextmenu", ".drop-button", this._handleClaim.bind(this)); 
  }

  static _handleClaim(event){
    event.preventDefault();
    event.stopPropagation();
    const button = event.currentTarget;
    const dropInfo = button.dataset;
    const messageId = button.closest(".chat-message").dataset.messageId;

    if (dropInfo.dropCount > 0){

      /* get best actor */
      const actor = canvas.tokens.controlled[0]?.actor ?? game.user.character;

      if(!actor){
        ui.notifications.warn(game.i18n.localize('NOVA.ClaimNoActor'));
        return;
      }

      switch(event.type) {
        case 'contextmenu':
          /* right click, modify prompt and fallthrough */
          /* TODO implement dialog for modifications.
           * for now, just invert the dropInfo type
           */
          dropInfo.dropType = {'fuel': 'health', 'health': 'fuel'}[dropInfo.dropType] ?? dropInfo.dropType;
          dropInfo.dropName = `&nbsp;<del>${dropInfo.dropName}</del>&nbsp;${game.i18n.format(CONFIG.NOVA.drops[dropInfo.dropType], {quantity: dropInfo.dropCount})}`;
        case 'click':
          /* left click, default claim */
          return actor.claimDrop(messageId, dropInfo);
      }
    }

  }

  static _updateClaimed(msg) {
    if(MODULE.isFirstGM()) {
      const dropId = msg.getFlag('nova','claim');
      const dropMsg = game.messages.get(dropId)
      if(dropMsg) {
        let roll = dropMsg.roll;
        roll.claimed = true;
        const data = {roll: JSON.stringify(roll)};
        return dropMsg.update(data); 
      }
    }
  }
}

export class NovaRoll extends Roll {
  constructor(...args) {
    super(...args);
  }

  get result() {
    if (this.total < 3) return game.i18n.localize('NOVA.RollFailure');
    if (this.total < 5) return game.i18n.localize('NOVA.RollSuccess');
    return game.i18n.localize('NOVA.RollTotalSuccess');
  }

  /**
   * Render a DropRoll instance to HTML
   * @param {object} [chatOptions]      An object configuring the behavior of the resulting chat message.
   * @return {Promise<string>}          The rendered HTML template as a string
   */
  async render(chatOptions={}) {
    chatOptions = foundry.utils.mergeObject({
      user: game.user.id,
      flavor: null,
      template: this.constructor.CHAT_TEMPLATE,
      blind: false
    }, chatOptions);

    // Execute the roll, if needed
    if (!this._evaluated) this.evaluate();

    // Define chat data
    let chatData = await novaChatData(this, chatOptions);

    // Render the roll display template
    return renderTemplate(chatOptions.template, chatData);
  }

  static CHAT_TEMPLATE = 'systems/nova/templates/dice/roll.html'
}

