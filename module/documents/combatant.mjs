
export class NovaCombatant extends Combatant {

  get category() {
    const npc = this.actor.type == 'npc';
    const zeroHp = this.actor.system.health.value === 0;

    return {npc, zeroHp, activeNpc: npc && !zeroHp, dropNpc: npc && zeroHp };
  }

  /**
   * Perform follow-up operations when a set of Documents of this type are created.
   * This is where side effects of creation should be implemented.
   * Post-creation side effects are performed only for the client which requested the operation.
   * @param {Document[]} documents                    The Document instances which were created
   * @param {DocumentModificationContext} context     The context for the modification operation
   * @protected
   */
  static async _onCreateDocuments(documents, context){

    await super._onCreateDocuments(documents, context);
    const numMoved = documents.reduce( (acc, combatant) => {
      if (combatant.actor.type == 'npc'
          && combatant.actor.system.health.value > 0) {
        acc++; 
      }

      return acc;
    },0);

    return context.parent.nextTurn(numMoved);
  }

  

  get turnEnded() {
    /* our turn is over this round if we have ended item
     * or have been marked defeated */
    const ended = this.getFlag('nova', 'turnEnded') ?? false;
    const dead = this.defeated;
    const isNpc = this.actor.type == 'npc';
    return ended || dead || isNpc;
  }

  /* return promise */
  endTurn() {
    return this.setFlag('nova', 'turnEnded', true);
  }

  startTurn() {
    return this.setFlag('nova', 'turnEnded', false);
  }

  
  
}
