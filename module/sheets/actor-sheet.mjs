import {onManageActiveEffect, prepareActiveEffectCategories} from "../helpers/effects.mjs";
import {attributeRoll, npcRoll} from '../helpers/dice.mjs'

/**
 * Extend the basic ActorSheet with some very simple modifications
 * @extends {ActorSheet}
 */
export class NovaActorSheet extends ActorSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["nova", "sheet", "actor"],
      template: "systems/nova/templates/actor/actor-sheet.html",
      width: 600,
      height: 600,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "features" }]
    });
  }

  /** @override */
  get template() {
    return `systems/nova/templates/actor/actor-${this.actor.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  async getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = await super.getData();

    // Use a safe clone of the actor data for further operations.
    let actorData = context.actor;

    // Add the actor's data to context.data for easier access, as well as flags.

    /** @deprecated */
    context.data = actorData.system;

    context.system = actorData.system;
    context.flags = actorData.flags;

    // Prepare character data and items.
    if (actorData.type == 'spark') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    // Prepare NPC data and items.
    if (actorData.type == 'npc') {
      this._prepareNpcData(context);
    }

    // Add roll data for TinyMCE editors.
    context.rollData = context.actor.getRollData();

    // Prepare active effects
    context.effects = prepareActiveEffectCategories(this.actor.effects);

    // Add pre-translated strings
    context.i18n = {
      none: game.i18n.localize('NOVA.None'),
    }

    context.bio = await TextEditor.enrichHTML(actorData.system.biography, {async:true, secrets: context.owner, rollData: context.rollData})

    return context;
  }

  _prepareNpcData(context) {
    let npcActions = [];

    /* all npcs have harm and move */

    npcActions.push(NovaActorSheet._createNpcActionSet(context.data.moves, "moves", "NOVA.Moves.Label", "NOVA.Move.Use"));

    /* elites have a few more */
    if (context.data.elite) {
      npcActions.push(NovaActorSheet._createNpcActionSet(context.data.commands, "commands", "NOVA.Commands.Label", "NOVA.Command.Use"));
      npcActions.push(NovaActorSheet._createNpcActionSet(context.data.lair, "lair", "NOVA.Lair.Label", "NOVA.Lair.Use"));
    }

    /* any NPC can have a variant */
    npcActions.push(NovaActorSheet._createNpcActionSet(context.data.variants, "variants", "NOVA.Variants.Label", "NOVA.Variant.Use"));

    /* but only Elites have followers */
    if (context.data.elite) {
      npcActions.push(NovaActorSheet._createNpcActionSet(context.data.followers, "followers", "NOVA.Followers.Label", "NOVA.Follower.Use"));
    }

    context.npcActions = npcActions;
    context.npcHarm = NovaActorSheet._createNpcActionSet(context.data.harm, "harm", "NOVA.Harm.Label", "NOVA.Harm.Use")

    /* migration from 1.0 to 1.1 data structure -- harm for NPCs is a 2 entry array */
    //if (typeof context.npcHarm.entries == 'object') {
    //  //handlebars mangled arrays somehow got through, correct this
    //  context.npcHarm.entries = Object.values(context.npcHarm.entries);
    //}

    context.npcHarm.entries = context.npcHarm.entries.map( entry => {
      if (typeof entry == 'string') {
        //1.0 version, make into 2d array grabbing the first number, hoping its the Harm value
        const regex = /\d+/;
        const result = entry.match(regex)[0];
        return [result ?? "0", entry, ''];
      }

      return entry;
    })

    context.statusList = CONFIG.statusEffects;
    return;
  }

  static _createNpcActionSet(stringList, listField, label, flavor) {
    const localLabel = game.i18n.localize(label);

    return {
      entries: stringList,
      listField,
      label: localLabel,
      deleteLabel: game.i18n.format("NOVA.ActionList.Delete", {label:localLabel}),
      rollLabel: game.i18n.format("NOVA.ActionList.Show", {label: localLabel}),
      flavor: game.i18n.localize(flavor)
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareCharacterData(context) {
    // Handle ability scores.
    for (let [k, v] of Object.entries(context.data.attributes)) {
      v.label = game.i18n.localize(CONFIG.NOVA.attributes[k]) ?? k;
    }
  }

  /**
   * Organize and classify Items for Character sheets.
   *
   * @param {Object} context The context from which to build and
   * sort our various item lists.
   *
   * @return {undefined}
   */
  _prepareItems(context) {
    
    /* sort and insert our item types at root for convienence */
    let {itemTypes} = context.actor;

    //for each item type to be inserted at root, sort its internal array of items according to its `sort` value
    Object.keys(itemTypes).forEach( (key) => { itemTypes[key] = itemTypes[key].sort( (a,b) => (a.sort ?? 0) - (b.sort ?? 0) )});

    mergeObject(context, itemTypes); 

    context.powerLayout = {'passive': 'NOVA.PowerPassive', 'supernova': 'NOVA.PowerSupernova', 'active': 'NOVA.FlarePower', };

    context.persistentInfo = [{
      id: '',
      name: game.i18n.localize("NOVA.None"),
      img: false
    }];

    context.freePersistants = [{
      id: '',
      name: game.i18n.localize("NOVA.None"),
      img: false
    }];

    context.powerModInfo = [{
      id: '',
      name: game.i18n.localize("NOVA.None"),
      img: false
    }];

    //sort the two subtypes of flare mods
    context.flare.forEach( (mod) => {
      if (mod.system.type == 'persistent') {
        const modInfo = {id: mod.id, img: mod.img, name: mod.name};

        /* add to the overall info array */
        context.persistentInfo.push(modInfo)

        /* if this mod isn't attached, add it to the list
         * of available persistant's to attach */
        if( !context.actor.system.mods.includes(modInfo.id) ){
          context.freePersistants.push(modInfo); 
        }

      } else if (mod.system.type == 'power') {
        context.powerModInfo.push({id: mod.id, img: mod.img, name: mod.name});
      }
    });

   }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);

    // Render the item sheet for viewing/editing prior to the editable check.
    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    // Item summaries
    html.find(".items-list .item .item-name h4").click(event => this._onItemSummary(event));

    // -------------------------------------------------------------
    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    // Add Inventory Item
    html.find('.item-create').click(this._onItemCreate.bind(this));

    // Delete Inventory Item
    html.find('.item-delete').click(this._onItemDelete.bind(this));

    // Active Effect management
    html.find(".effect-control").click(ev => onManageActiveEffect(ev, this.actor));

    // Rollable abilities.
    html.find('.rollable').click(this._onRoll.bind(this));

    html.keypress( (event)=>{ if(event.which == '13') event.preventDefault(); } );
    html.find('.drop-button').click(this._onRollDrop.bind(this));

    // Drag events for macros.
    if (this.actor.isOwner) {
      let handler = ev => this._onDragStart(ev);
      html.find('li.item').each((i, li) => {
        if (li.classList.contains("inventory-header")) return;
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }

    /* disable any fields that are targeted by AEs */
    Object.keys(flattenObject(this.object.overrides)).forEach( key => {
      this.element.find(`[name="${key}"]`).prop('disabled', true);
    });
  }

  async _onItemDelete(event) {
    const li = $(event.currentTarget).parents(".item");

    /* is proper item? or npc synthetic? */
    const isItem = !!li.data("itemId") ? true : false;

    if (isItem) {
      const item = this.actor.items.get(li.data("itemId"));
      await item.delete();
    } else {
      /* npc synthetic */
      const actionType = li.data("npcItem");
      const index = li.data("index");
      await this.actor._deleteNpcAction(actionType, index);
    }
    li.slideUp(200, () => this.render(false));
  }

  /**
   * Handle creating a new Owned Item for the actor using initial data defined in the HTML dataset
   * @param {Event} event   The originating click event
   * @private
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const header = event.currentTarget;
    // Get the type of item to create.
    const type = header.dataset.itemType;
    const subType = header.dataset.subType;

    /* Handle NPC psuedo-items */
    if (NovaActorSheet._isNpcAction(type)){
      return await this.actor._addNpcAction(type);
    }
    // Grab any data associated with this control.
    //const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${subType.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      system: {
        type: subType
      }
    };

    // Finally, create the item!
    return await CONFIG.Item.documentClass.create(itemData, {parent: this.actor});
  }

  static _isNpcAction(type) {
    return !!(CONFIG.NOVA.npcActions[type] ?? false)
  }


  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  _onRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;

    const npcData = $(event.currentTarget).parents(".item");

    // Handle rolls.
    switch (dataset.rollType) {
      case 'item': {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
        break;
      } 
      case "attribute": {
        return attributeRoll( dataset.attribute, this.actor );  
      } 
      case 'harm': {
        const index = npcData.data('index');
        const harm = this.actor.system.harm[index]; 
        return this.actor.harmRoll(harm[0], harm[1], harm[2]);
      }
      default:
        /* it must be a 'plain' action */
        const index = npcData.data('index');
        const flavor = npcData.data('flavor'); 
        return npcRoll(index, this.actor, this.actor.data.data[dataset.rollType], flavor);
    }
  }

  _onRollDrop(event, ...args) {
    switch (this.actor.type) {
      case 'npc':
        return this.actor.rollDrop();
      case 'spark':
        return this.actor.revive();
    }
  }

  /**
   * Handle toggling and items expanded description.
   * @param {Event} event   Triggering event.
   * @private
   */
  async _onItemSummary(event) {
    event.preventDefault();
    const li = $(event.currentTarget).parents(".item");

    // Toggle summary
    if ( li.hasClass("expanded") ) {
      let summary = li.children(".item-summary");
      summary.slideUp(200, () => summary.remove());
    } else {
      const item = this.actor.items.get(li.data("item-id"));
      const chatData = await item.getItemChatData({embedHarm: false, /*secrets: this.actor.isOwner*/});
      const desc = await TextEditor.enrichHTML(chatData.description, {async:true});
      let div = $(`<div class="item-summary">${desc}</div>`);
      li.append(div.hide());
      div.slideDown(200);
    }
    li.toggleClass("expanded");
  }

}
