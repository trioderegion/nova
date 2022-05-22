import { MODULE } from '../helpers/module.mjs'
import { attributeRoll } from '../helpers/dice.mjs'
import { NovaItem } from './item.mjs'

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

export async function applyStatus(targets, status, {active = true, overlay = false} = {}) {

  if(typeof targets == 'string') targets = [targets];

  const promises = targets.map( async (targetUuid) => {
    let target = await fromUuid(targetUuid);
    target = target instanceof Actor ? target.token ? target.token.object : target.getActiveTokens()[0] : target.object;
    if (target?.isOwner) {
      return target.toggleEffect(status, {active, overlay});
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
   *
   * AEs have already been applied by this stage (this.overrides)
   */
  prepareDerivedData() {
    const actorData = this.data;
    //const data = actorData.data;
    //const flags = actorData.flags.nova || {};

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
    //const data = actorData.data;
    
    /* combine current and bonus values for ability scores */
    for (let [key, {value, bonus}] of Object.entries(actorData.data.attributes)) {
      actorData.data.attributes[key].total = value + bonus;
    }

    /* gather persistent mod changes */
    const changes = this.data.data.mods.flatMap( modId => {

      if(modId == undefined) return [];

      const mod = this.items.get(modId);

      if (mod?.data.data.affects == 'spark') {
        return mod.data.data.changes ?? []
      }

      return [];
    });

    changes.forEach( change => {

      if (change.value == undefined || change.value.length == 0) return;
      const value = getProperty(actorData, change.target);

      let expression;
      switch(change.mode) {
      case CONST.ACTIVE_EFFECT_MODES.ADD:
        expression = `${value} + ${change.value}`;
        break;
      case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
        expression = `(${value}) * ${change.value}`;
      case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
        expression = `${change.value}`;
      }

      expression = Roll.replaceFormulaData(expression, actorData.data)
      const result = Roll.safeEval(expression)

      setProperty(actorData, change.target, result);

      /* are we already overriding this from an AE?
       * if not, add to overrides so the sheet will
       * disable its input */
      if(!hasProperty(this.overrides, change.target)) {
        setProperty(this.overrides, change.target, value);
      } 

    })
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

  /*
   * If an attached flare mod is deleted, ensure its removed
   * from any referencing spark or power mods
   */
  _onDeleteEmbeddedDocuments(type, documents, result, ...args){
    super._onDeleteEmbeddedDocuments(type, documents, result, ...args);

    /* grab any flare mod IDs */
    if(this.type == 'spark') {

      let actorUpdates = {};
      let itemUpdates = [];

      const flareIds = documents.reduce( (acc, curr) => {
        if (curr.data.type == 'flare') {
          let category = curr.data.data.type == 'persistent' ? 'persistent' : 'power';
          acc[category].push(curr.id)
        }

        return acc;

      },{persistent: [], power: []});

      if (flareIds.persistent.length > 0) {

        /* remove attachments to the spark */
        const updatedMods = this.data.data.mods.map( id => {
          return flareIds.persistent.includes(id) ? '' : id;
        });

        const undefOrEmpty = e => (e == undefined || e == '');

        /* if there was a change */
        if (updatedMods.filter(undefOrEmpty).length != this.data.data.mods.filter(undefOrEmpty).length){
          mergeObject(actorUpdates, {data: {mods: updatedMods}}); 
        }
      }

      /* remove attachments to other powers */
      if (flareIds.power.length > 0){
        
        itemUpdates = flareIds.power.reduce( (acc, curr) => {
          const attachedItem = this.items.find( item => (getProperty(item.data.data, 'mods') ?? []).includes(curr) );

          if (attachedItem) {
            const modUpdate = attachedItem.data.data.mods.map( id => id == curr ? null : id)
            acc.push({_id: attachedItem.id, 'data.mods': modUpdate});
          }

          return acc;
        }, [])
      }

      /* try to batch these updates together, at least a little */
      (async () => {
        await this.update(actorUpdates);
        await this.updateEmbeddedDocuments("Item", itemUpdates);
      })();
    }
    
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

  async harmRoll(rollExpression, description = '', statusId = '', {createChatMessage = true, rollMode = game.settings.get('core','rollMode')} = {}) {
    const rollData = this.getRollData();

    const roll = await new Roll(rollExpression, rollData).evaluate({async: true});

    let targets = [];
    game.user.targets.forEach( target => targets.push(target.actor.uuid) );

    // Initialize chat data.
    let speaker = ChatMessage.getSpeaker({ token: this.token ?? this.getActiveTokens()[0]?.document, actor: this });

    speaker.alias += `: ${game.i18n.localize('NOVA.Harm.Label')}`

    const harmProxy = mergeObject(CONFIG.NOVA.DEFAULTS.HARM_DATA, {special: description, harm: {value: roll.total}, status: {target: statusId}});

    let footEntries = NovaItem.footerEntries(harmProxy);

    if(this.data.data.keywords.length > 0) {
      footEntries.push(`${game.i18n.localize('NOVA.Keywords')}: ${this.data.data.keywords}`);        
    }

    const harmFooter = footEntries.reduce( (acc, entry) => {
      return acc += `${acc.length == 0 ? '' : ' |'} ${entry}` 
    },"");


    let data = {
      harmInfo: harmProxy,
      targets,
      harmLabel: game.i18n.format("NOVA.ApplyHarm", {num: roll.total}),
      proxy: true,
      harmFooter,
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
    if ('harm' in (changed.data ?? {})) {
      changed.data.harm = Object.values(changed.data.harm);
    }

    if (options.change == undefined) {
      /* check if this is a resource update we can display */
      const flattened = flattenObject(changed);
      const updatedPath = Object.keys(CONFIG.NOVA.costResource).find( path => {
        const update = flattened[path];
        if (update) {
          /* a field we can display is in this update, is there a delta? */
          const display = getProperty(this.data, path) != update;
          return display;
        }

        return false;
      });

      if (updatedPath) {
        options.change = flattened[updatedPath] - getProperty(this.data, updatedPath);
        options.source = game.i18n.localize(CONFIG.NOVA.costResource[updatedPath])
      }
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
      current.push(CONFIG.NOVA.DEFAULTS.NPC_ACTION[type]);
    } else current = [["0", current, ''], CONFIG.NOVA.DEFAULTS.NPC_ACTION[type]]
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
