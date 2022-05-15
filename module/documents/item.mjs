import { applyUseChange, applyStatus } from './actor.mjs'

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

  /*
   * If a flare type 'persistent' has its 'affects' field changed 
   * to OR from 'spark', we need to wipe the 'changes' field as the 
   * modifier set needs to be swapped entirely
   */
  _preUpdate(change, ...args) {
    super._preUpdate(change, ...args);

    const affectsChanged = hasProperty(change, 'data.affects');

    if(affectsChanged) {
      /* double check transition */
      const current = getProperty(this.data, 'data.affects');
      const updated = getProperty(change, 'data.affects');

      /* if there is an actual change AND we are going to or coming from a 'spark' mod */
      const transitioned = (current !== updated) && ( current === 'spark' || updated === 'spark' );
      if (transitioned) {
        /* wipe current changes data */
        change.data.changes = [];
      }
    }
    
  }

  async getItemChatData({embedHarm = true, rollMode = game.settings.get('core', 'rollMode') } = {}) {
    const item = this.data;
    
    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ token: this.actor.token ?? this.actor.getActiveTokens()[0].document, actor: this.actor });
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

    const html = await renderTemplate("systems/nova/templates/dice/item-roll.html", {mods, description, harm, uuid: this.uuid, embedHarm});
    

    return {speaker, rollMode, label, description: html}
  }

  async getHarmChatData(harmInfo, {rollMode = game.settings.get('core', 'rollMode')} = {}) {

    let targets = [];
    game.user.targets.forEach( target => targets.push(target.actor.uuid) );
    const casters = [this.actor.uuid];

    // Initialize chat data.
    let speaker = ChatMessage.getSpeaker({ token: this.actor.token ?? this.actor.getActiveTokens()[0].document, actor: this.actor });

    speaker.alias += `: ${this.name} - ${harmInfo.name}`

    const footEntries = NovaItem.footerEntries(harmInfo);
    const harmFooter = footEntries.reduce( (acc, entry) => {
      return acc += `${acc.length == 0 ? '' : ' |'} ${entry}` 
    },"");

    let data = {harmInfo, casters, targets, itemUuid: this.uuid, harmFooter};
    data.resourceLabel = game.i18n.format("NOVA.SpendResource", {num: harmInfo.cost.value, resource: game.i18n.localize(CONFIG.NOVA.costResource[harmInfo.cost.source])});
    data.harmLabel = game.i18n.format("NOVA.ApplyHarm", {num: harmInfo.harm.value});

    const html = await renderTemplate("systems/nova/templates/chat/harm-roll.html", data);

    return {speaker, description: html, rollMode};
  }

  /**
   * Handle rolling
   * @param 
   * @private
   */
  async roll({rollModeOverride, createMessage=true} = {}) {

    const {speaker, rollMode, label, description} = await this.getItemChatData({rollMode: rollModeOverride});

    //send chat message
    return ChatMessage.create({
      speaker: speaker,
      rollMode: rollMode,
      flavor: label,
      content: description
    });
  }

  getHarmInfo(identifier) {

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

    const item = this;

    return {
      _spendRoll: null,
      _harmRoll: null,
      _harmSource: currentHarm,
      index,
      get harmArrayClone() {
        return deepClone(this._harmSource);
      },
      get harm() {
        return this._harmSource[this.index];
      },
      async evalHarm() {
        let harm = duplicate(this._harmSource[this.index]);

        item.modifyHarm(harm);

        if(!this._spendRoll || !this._harmRoll) {
          const rollData = item.getRollData();

          if (!this._spendRoll) {
            this._spendRoll = await new Roll(harm.cost.value, rollData).evaluate({async:true}); 
          } 

          if (!this._harmRoll) {
            this._harmRoll = await new Roll(harm.harm.value, rollData).evaluate({async:true});
          }
        }

        harm.cost.value = this._spendRoll.total;
        harm.harm.value = this._harmRoll.total; 

        return harm;
      }
    }
  }

  modifyHarm(harmData) {

    /* do not modify locked harm entries */
    if(harmData.locked) return;

    /* collect *all* changes */
    let changes = [];

    switch(this.data.data.type) {
      case 'active':
        /* active powers have mods attached directly */
        changes = this.data.data.mods.flatMap( modId => {
          if(modId == undefined) return [];
          return this.actor.items.get(modId)?.data.data.changes ?? []
        });
        break;

      case 'passive':
      case 'supernova':
        /* others derive from persistent mods attached to spark */
        changes = this.actor.data.data.mods.flatMap( modId => {
          if(modId == undefined) return [];
          const mod = this.actor.items.get(modId);
          return mod?.data.data.affects == this.data.data.type ? mod.data.data.changes : [];

        });
        break;

    }

    /* apply changes linearly */
    changes.forEach( change => {

      let value = getProperty(harmData, change.target);

      switch(change.target) {
        /* range has special handling, and is stored as a number */
        case 'range.min':
        case 'range.max':

          const modification = Number(change.value); //heaven help the user that attempts a roll expression

          switch (change.mode) {
            case CONST.ACTIVE_EFFECT_MODES.ADD:
              value = Math.clamped(value + modification, 1, 4);
              break;
            case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
              value = Math.clamped(modification, 0, 4);
              break;
          }

          break;
        default:
          /* all others are simple maf roll expressions */
          value = NovaItem._applyExpression(value, change.value, change.mode);
          break;
      }

      setProperty(harmData, change.target, value);
    });
  }

  static _applyExpression(current, change, mode) {
    
    switch (mode) {
      case CONST.ACTIVE_EFFECT_MODES.ADD:
        return `${current} + ${change}`;
      case CONST.ACTIVE_EFFECT_MODES.MULTIPLY:
        return `(${current}) * ${change}`;
      case CONST.ACTIVE_EFFECT_MODES.OVERRIDE:
        return change;
    }

  }

  /** 
   * Handle adding new harm data
   */
  async addHarm(harmData = CONFIG.NOVA.DEFAULTS.HARM_DATA){

    return this._updateArray('data.harm', harmData);
  }

  /**
   * Handle deleting harm data
   * @param {String|Number} name or index
   */
  async deleteHarm(identifier) {

    const harmInfo = this.getHarmInfo(identifier);
    if(!harmInfo) return false;

    return this._removeArrayElement('data.harm', harmInfo.index);
  }

  async updateHarm(identifier, harmData) {
    const harmInfo = this.getHarmInfo(identifier);
    if(!harmInfo) return false;

    return this._updateArray('data.harm', harmData, harmInfo.index);
  }

  async toggleHarmLock(identifier, forceState = undefined) {
    const harmInfo = this.getHarmInfo(identifier);
    if(!harmInfo) return false;

    let harm = harmInfo.harm;
    harm.locked = forceState == undefined ? !harm.locked : forceState;

    return this.updateHarm(identifier, harm);
  }

  async rollHarm(identifier, {createChatMessage = true, rollModeOverride} = {}) {
    const harmInfo = this.getHarmInfo(identifier);

    const {speaker, rollMode, /*label,*/ description} = await this.getHarmChatData( await harmInfo.evalHarm(), {rollMode: rollModeOverride});

    return ChatMessage.create({
      speaker,
      rollMode,
      //flavor: label,
      content: description
    }, {temporary: !createChatMessage});

  }

  /*
   * Handle adding a new change entry for flare mods
   *
   */
  async addChange(changeData = CONFIG.NOVA.DEFAULTS.CHANGE_DATA) {
    if(this.data.data.affects == 'spark' && changeData.target == CONFIG.NOVA.DEFAULTS.CHANGE_DATA.target) {
      changeData.target = CONFIG.NOVA.persistTargets['NOVA.Fuel'];
    }
    return this._updateArray('data.changes', changeData);
  }

  async updateChange(index, changeData) {
    return this._updateArray('data.changes', changeData, index);
  }

  async deleteChange(index) {
    return this._removeArrayElement('data.changes', index);
  }

  async _updateArray(path, data, index = null) {

    /* accounting for 1.0 -> 1.1 migration where harm/change was added
     * to items */
    let currentArray = duplicate(getProperty(this.data, path) ?? []);

    if(index == undefined) {
      /* add new */
      currentArray.push(data);
    } else {
      /* update existing */
      mergeObject(currentArray[index], data);
    }

    return this.update({[path]: currentArray});
  }
  
  async _removeArrayElement(path, index) {

    let currentArray = getProperty(this.data, path);

    if(index > currentArray.length - 1) return false;

    currentArray.splice(index,1);
    await this.update({[path]: currentArray})
  }
  
  static _chatListeners(html) {
    html.on("click", ".harm-button button", this._onItemCardAction.bind(this));
    html.on("click", ".harm-apply button", this._onHarmButtonAction.bind(this));
    html.on("contextmenu", ".harm-apply button", this._onHarmButtonAction.bind(this));

  }

  static async _onItemCardAction(event) {

    event.preventDefault();
    const button = event.currentTarget;
    const harmId = button.dataset.harmIndex;
    const {itemUuid} = button.closest(".harm-button").dataset;

    const item = await fromUuid(itemUuid);

    return item.rollHarm(harmId);

  }

  static async _onHarmButtonAction(event) {

    event.preventDefault();

    /* we are intercepting a right click for "auto-damage" */
    event.stopPropagation();

    const button = event.currentTarget;
    //const {itemUuid} = button.closest(".harm-apply").dataset;
    let {path, targets, change, statusId} = button.dataset;

    if (event.type == 'click') {
      /* apply change to selected */
      targets = canvas.tokens.controlled.map( token => token.document.uuid );
    } else if (event.type == 'contextmenu') {
      /* apply change to predefined targets/source */
      targets = targets.split(',');
    } else {
      /* um...no clue */
      targets = []
    }
   
    if (targets.length > 0) {
      change = Number(change);
      await applyUseChange(path, targets, -change);
      
      if( statusId != '') {
        const status = CONFIG.statusEffects.find( effect => effect.id == statusId ) ?? statusId;
        await applyStatus(targets, status);
      }
    }
  }

  static footerEntries(harmInfo) {
    let entries = [];
    if( (harmInfo.target?.type ?? 'none') !== 'none'){
      /* add target info */
      entries.push(`${game.i18n.localize('NOVA.Target')}: ${harmInfo.target.value.length == 0 ? '' : harmInfo.target.value + ' '}${game.i18n.localize(CONFIG.NOVA.target[harmInfo.target.type])}`);
    }

    if(!!harmInfo.range?.min || !!harmInfo.range?.max) {
      let entry = game.i18n.localize('NOVA.Range') + ': '
      const min = game.i18n.localize(CONFIG.NOVA.range[harmInfo.range.min]) ?? '';
      const max = game.i18n.localize(CONFIG.NOVA.range[harmInfo.range.max]) ?? '';

      if( !!min && !!max ){
        entry += `${min} - ${max}`
        entries.push(entry);
      } else if (!!min) {
        entry += `${min}`;
        entries.push(entry);
      } else if (!!max) {
        entry += `${max} (${game.i18n.localize('NOVA.MaximumAbbr').toLowerCase()})`
        entries.push(entry);
      }
    }

    return entries;
  }
  
}

