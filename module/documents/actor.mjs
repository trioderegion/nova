import { MODULE } from '../helpers/module.mjs'
import { attributeRoll } from '../helpers/dice.mjs'

const ActorData = foundry.data.ActorData;

export async function applyUseChange(path, targets, change) {

  if(typeof targets == 'string') targets = [targets];

  const promises = targets.map( async (targetUuid) => {
    let target = await fromUuid(targetUuid);
    target = target instanceof TokenDocument ? target.actor : target;
    if (target.isOwner) {
      const original = getProperty(target.data, path);
      return target.update({[path]: original + change}, {change, source: game.i18n.localize(CONFIG.NOVA.costResource[path])});
    }

    return false;
  })

  return Promise.all(promises);
}


class NovaActorData extends ActorData {
  static defineSchema() {
    let schema = super.defineSchema();
    schema.img.default = (data) => { return data.type === 'spark' ? this.DEFAULT_SPARK_TOKEN : CONST.DEFAULT_TOKEN; };
    const currentDefault = schema.token.default;
    schema.token.default = (data) => { 
      let token = currentDefault(data);
      if (data.type === 'spark') {
        token.vision = true;
        token.actorLink = true;
        token.disposition = 1;
      }
      return token;
    }
    return schema;
  }

  static DEFAULT_SPARK_TOKEN = 'icons/svg/sun.svg';
}

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class NovaActor extends Actor {

  static get schema() {
    return NovaActorData;
  }

  


  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this.data;
    const data = actorData.data;
    const flags = actorData.flags.nova || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'spark') return;

    // Make modifications to data here. For example:
    const data = actorData.data;
    
    /* combine current and bonus values for ability scores */
    for (let [key, {value, bonus}] of Object.entries(data.attributes)) {
      data.attributes[key].total = value + bonus;
    }

  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    //const data = actorData.data;
    //data.xp = (data.cr * data.cr) * 100;
  }

  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /* @param {String|Number}
  /* @param {Object} options
   * @param {Boolean} [options.createMsg]
   * @param {Number} [options.bonusDie]
  /* @return {NovaRoll}
   */
  async rollTest(attribute, options ){
    
    const roll = attributeRoll(attribute, this, options);

    return roll;

  }

  async harmRoll(rollExpression, description, {createChatMessage = true, rollMode = game.settings.get('core','rollMode')} = {}) {
    const rollData = this.getRollData();

    const roll = await new Roll(rollExpression, rollData).evaluate({async: true});

    let targets = [];
    game.user.targets.forEach( target => targets.push(target.actor.uuid) );

    // Initialize chat data.
    let speaker = ChatMessage.getSpeaker({ token: this.token ?? this.getActiveTokens()[0].document, actor: this });

    speaker.alias += `: ${game.i18n.localize('NOVA.Harm.Label')}`

    const harmProxy = mergeObject(CONFIG.NOVA.DEFAULTS.HARM_DATA, {special: description, harm: {value: roll.total}});

    let data = {
      harmInfo: harmProxy,
      targets,
      harmLabel: game.i18n.format("NOVA.ApplyHarm", {num: roll.total}),
      proxy: true,
    }

    const html = await renderTemplate("systems/nova/templates/chat/harm-roll.html", data);

    return ChatMessage.create({speaker, rollMode, content: html}, {temporary: !createChatMessage});

  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.data.type == 'npc') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.attributes) {
      for (let [k, v] of Object.entries(data.attributes)) {
        data[k] = v.total;
      }
    }
  }


  /* @override */
  async update(data, options) {

    /* update locally and refresh tracker */
    const result = await super.update(data, options);
    ui.combat.render();

    return result;
  }

  _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);
    this._showScrollingText(options.change, options.source);
  }

  async _preUpdate(changed, options, user) {
    await super._preUpdate(changed,options,user);

    /* ensure NPC harm comes in as an array */
    if ('harm' in changed.data) {
      changed.data.harm = Object.values(changed.data.harm);
    }
  }

  /*
   * Displays change on all token's owned by this actor
   *
   *
   * LICENSE: Body of showScrollingText taken from
   * Actor5e#_displayScrollingDamage.
   * MIT Copyright 2021 Andrew Clayton
   * https://gitlab.com/foundrynet/dnd5e/-/blob/master/LICENSE.txt
   */
  _showScrollingText(change, label) {

    if ( !change ) return;
    change = Number(change);
    const tokens = this.isToken ? [this.token?.object] : this.getActiveTokens(true);
    for ( let t of tokens ) {
      t.hud.createScrollingText(`${change.signedString()} ${label}`, {
        anchor: CONST.TEXT_ANCHOR_POINTS.TOP,
        fontSize: 48, // Range between [16, 48]
        fill: CONFIG.NOVA.changeColors[change < 0 ? "neg" : "pos"],
        stroke: 0x000000,
        strokeThickness: 4,
        jitter: 0.25
      });
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.data.type !== 'npc') return;

    // Process additional NPC data here.
  }

  _addNpcAction(type) {
    /* get current list */
    let current = duplicate(this.data.data[type]);
    if ( current instanceof Array) {
      current.push(game.i18n.localize(CONFIG.NOVA.DEFAULTS[type]));
    } else current = [["0", current], CONFIG.NOVA.DEFAULTS[type]]
    return this.update({[`data.${type}`]: current});
  }

  _deleteNpcAction(type, index) {
    let current = duplicate(this.data.data[type]);
    current.splice(index, 1);
    return this.update({[`data.${type}`]: current});
  }
  
  rollDrop(expression = '1d6') {
    return (new game.nova.DropRoll(expression)).toMessage();
  }

  async claimDrop(messageId, dropInfo) {
   
    if(MODULE.hasActiveGM() === false) {
      ui.notifications.warn(game.i18n.localize('NOVA.Error.ClaimNoGM'));
      return;
    }

    const updateField = {
      'fuel': 'data.fuel',
      'health': 'data.health',
    }[dropInfo.dropType]

    const field = this.data.data[dropInfo.dropType];

    if(field.max == field.value) {
      ui.notifications.warn(game.i18n.localize('NOVA.Error.DropResourceFull'));
    }

    const data = {
      img: this.img,
      localText: game.i18n.format(CONFIG.NOVA.chat.claim, {name: this.name, drop: dropInfo.dropName})
    }

    const content = await renderTemplate('systems/nova/templates/chat/drop-claim.html', data);

    await ChatMessage.create({
      content,
      speaker: {alias: game.user.name},
      flags: {nova: {claim: messageId}}
    });

    return this.update({[updateField]: {value: Math.min(field.value + Number(dropInfo.dropCount), field.max)}})
  }

  get hp() {
    return this.data.data.health.value;
  }

  get maxHp() {
    return this.data.data.health.max;
  }

  get fuel() {
    return this.data.data.fuel.value;
  }

  get maxFuel() {
    return this.data.data.fuel.max;
  }

  revive() {
    const health = Math.ceil(this.maxHp/2);
    const fuel = Math.ceil(this.maxFuel/2);

    return this.update({
      'data.health.value': health,
      'data.fuel.value': fuel
    });
  }

}
