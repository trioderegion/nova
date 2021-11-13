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
    return `systems/nova/templates/actor/actor-${this.actor.data.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve the data structure from the base sheet. You can inspect or log
    // the context variable to see the structure, but some key properties for
    // sheets are the actor object, the data object, whether or not it's
    // editable, the items array, and the effects array.
    const context = super.getData();

    // Use a safe clone of the actor data for further operations.
    const actorData = context.actor.data;

    // Add the actor's data to context.data for easier access, as well as flags.
    context.data = actorData.data;
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

    return context;
  }

  _prepareNpcData(context) {
    let npcActions = [];

    /* all npcs have harm and move */
    npcActions.push(NovaActorSheet._createNpcActionSet(context.data.harm, "harm", "NOVA.Harm.Label", "NOVA.Harm.Use"));
    npcActions.push(NovaActorSheet._createNpcActionSet(context.data.moves, "moves", "NOVA.Moves.Label", "NOVA.Move.Use"));
    npcActions.push(NovaActorSheet._createNpcActionSet(context.data.variants, "variants", "NOVA.Variants.Label", "NOVA.Variant.Use"));

    /* elites have a few more */
    if (context.data.elite) {
      npcActions.push(NovaActorSheet._createNpcActionSet(context.data.followers, "followers", "NOVA.Followers.Label", "NOVA.Follower.Use"));
      npcActions.push(NovaActorSheet._createNpcActionSet(context.data.lair, "lair", "NOVA.Lair.Label", "NOVA.Lair.Use"));
      npcActions.push(NovaActorSheet._createNpcActionSet(context.data.commands, "commands", "NOVA.Commands.Label", "NOVA.Command.Use"));
    }

    context.npcActions = npcActions;
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
   * @param {Object} actorData The actor to prepare.
   *
   * @return {undefined}
   */
  _prepareItems(context) {

    //insert our item types at root for convienence
    mergeObject(context, context.actor.itemTypes); 

    context.persistentInfo = [{
      id: "",
      name: "None",
      img: false
    }];

    context.powerModInfo = [{
      id: "",
      name: "None",
      img: false
    }];

    //sort the two subtypes of flare mods
    context.flare.forEach( (mod) => {
      if (mod.data.data.type == 'persistent') {
        context.persistentInfo.push({id: mod.id, img: mod.img, name: mod.name})
      } else if (mod.data.data.type == 'power') {
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

    /* Handle NPC psuedo-items */
    if (NovaActorSheet._isNpcAction(type)){
      return await this.actor._addNpcAction(type);
    }
    // Grab any data associated with this control.
    const data = duplicate(header.dataset);
    // Initialize a default name.
    const name = `New ${type.capitalize()}`;
    // Prepare the item object.
    const itemData = {
      name: name,
      type: type,
      data: data
    };

    delete itemData.data["itemType"];

    // Finally, create the item!
    return await Item.create(itemData, {parent: this.actor});
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
    if (dataset.rollType) {
      if (dataset.rollType == 'item') {
        const itemId = element.closest('.item').dataset.itemId;
        const item = this.actor.items.get(itemId);
        if (item) return item.roll();
      } else if (dataset.rollType == "attribute") {
        return attributeRoll( dataset.attribute, this.actor );  
      } else {
        /* it must be a 'plain' action */
        const index = npcData.data('index');
        const flavor = npcData.data('flavor'); 
        return npcRoll(index, this.actor, this.actor.data.data[dataset.rollType], flavor);
      }
    }
  }

  _onRollDrop(/*event*/) {
    return (new game.nova.DropRoll('1d6')).toMessage();
  }

}
