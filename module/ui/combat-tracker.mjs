
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
    const playerTurn = context.combat?.isPlayerTurn() ?? false;
    context.playerStyle = playerTurn ? 'active-turn' : 'inactive-turn';
    context.gmStyle = !playerTurn ? 'active-turn' : 'inactive-turn';

    /* add in the ended turn flag */
    context.turns.forEach( turn => {
      turn.css = "";
      turn.ended = context.combat.combatants.get(turn.id)?.turnEnded ?? true;
    });

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
        }
    }

  }
}
