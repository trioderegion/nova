
export class NovaCombatTracker extends CombatTracker {
	static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
          classes: ['nova'],
          id: "combat",
          template: "systems/nova/templates/combat/combat-tracker.html",
          title: "Nova Combat Tracker",
          scrollY: [".directory-list"]
      });
    }

  async getData() {
    let context = await super.getData();


    /* which turn state are we in? */
    context.playerTurn = context.combat?.isPlayerTurn() ?? false;
    context.playerStyle = context.playerTurn ? 'active-turn' : 'inactive-turn';
    context.gmStyle = !context.playerTurn ? 'active-turn' : 'inactive-turn';

    /* add in the ended turn flag
     * and other combatant specific
     * info
     */
    context.turns = context.turns.reduce( (acc, turn) => {
      const combatant = context.combat.combatants.get(turn.id);

      /* super does not look at unlinked effects, do that here */
      turn.effects = new Set();
      if ( combatant.token ) {
        combatant.token.actor.effects.forEach(e => turn.effects.add(e));
        if ( combatant.token.overlayEffect ) turn.effects.add(combatant.token.overlayEffect);
      }

      turn.css = "";
      turn.ended = combatant?.turnEnded ?? true;
      turn.zeroHp = combatant.actor.system.health.value === 0 ? true : false;
      acc[combatant.actor.type].push(turn);

      return acc;
    },{spark: [], npc: []});

    return context;
  }

  /**
   * Taken from 'CombatTracker._onCombatantControl
   * Handle a Combatant control toggle
   * @private
   * @param {Event} event   The originating mousedown event
   */
  async _onCombatantControl(event) {
    event.preventDefault();
    event.stopPropagation();
    const btn = event.currentTarget;
    const li = btn.closest(".combatant");
    const combat = this.viewed;
    const c = combat.combatants.get(li.dataset.combatantId);

    // Switch control action
    switch (btn.dataset.control) {

        // Toggle combatant visibility
      case "toggleHidden":
        return c.update({hidden: !c.hidden});

        // Toggle combatant defeated flag
      case "toggleDefeated":
        return this._onToggleDefeatedStatus(c);

        // Roll combatant initiative
      case "rollInitiative":
        return combat.rollInitiative([c.id]);

      case "endTurn":
        /* only allow players to end their turn
         * if combat is running
         */
        if (combat.started) {
          return c.endTurn();
        } else {
          ui.notifications.error('Combat must begin before your turn can be ended.');
          return;
        }
      case "resetTurn":
        if (combat.started) {
          return c.startTurn();
        } else {
          ui.notifications.error('Combat must begin before your turn can be reset.');
          return;
        }
    }

  }

  /**
   * Handle mouse-down event on a combatant name in the tracker
   * @param {Event} event   The originating mousedown event
   * @return {Promise}      A Promise that resolves once the pan is complete
   * @private
   */
  async _onCombatantMouseDown(event) {
    event.preventDefault();

    const li = event.currentTarget;
    const combatant = this.viewed.combatants.get(li.dataset.combatantId);
    const token = combatant.token;
    if ( (token === null) || !combatant.actor?.testUserPermission(game.user, "OBSERVED") ) return;
    const now = Date.now();

    // Handle double-left click to open sheet
    const dt = now - this._clickTime;
    this._clickTime = now;
    if ( dt <= 250 ) return token?.actor?.sheet.render(true);

    // If the Token does not exist in this scene
    // TODO: This is a temporary workaround until we persist sceneId as part of the Combatant data model
    if ( token === undefined ) {
      return ui.notifications.warn(game.i18n.format("COMBAT.CombatantNotInScene", {name: combatant.name}));
    }
    
    // Control and pan to Token object or Roll Drop depending
    if ( combatant.category.dropNpc) {
      return this.viewed.handleRollDrop(combatant);
    } else if ( token.object ) {
      token.object?.control({releaseOthers: true});
      return canvas.animatePan({x: token.x, y: token.y});
    }
  }
}
