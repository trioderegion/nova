

export async function attributeRoll(attribute, actor) {

  const rollData = actor.getRollData();
  const attributeData = rollData.attributes[attribute];
  const rollString = `${attributeData.value + attributeData.bonus}d6kh`;
  const roll = await (new game.nova.NovaRoll(rollString, rollData ).evaluate({async:true}));
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: attributeData.label,
    rollMode: game.settings.get('core', 'rollMode'),
  });
  return roll;

}

export function npcRoll(index, actor, actionList, rollFlavor) {
  const content = actionList[index];
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
    drop: false,
    claimed: roll.claimed ?? false,
  }
}

export class DropRoll extends Roll {
  constructor(...args) {
    super(...args);
    this.claimed = false;
  }

  get result() {
    if (this.total < 3) return 'No Drop';
    if (this.total < 6) return '1 Fuel';
    return '1 Health';
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
    chatData.drop = this.total > 2;

    // Render the roll display template
    return renderTemplate(chatOptions.template, chatData);
  }

  static CHAT_TEMPLATE = 'systems/nova/templates/dice/roll.html'
}

export class NovaRoll extends Roll {
  constructor(...args) {
    super(...args);
  }

  get result() {
    if (this.total < 3) return 'Failure';
    if (this.total < 5) return 'Success';
    return 'Total Success';
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

