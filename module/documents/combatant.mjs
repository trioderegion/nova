
export class NovaCombatant extends Combatant {

  get turnEnded() {
    /* our turn is over this round if we have ended item
     * or have been marked defeated */
    const ended = this.getFlag('nova', 'turnEnded') ?? false;
    const dead = this.data.defeated;
    return ended || dead;
  }

  /* return promise */
  endTurn() {
    return this.setFlag('nova', 'turnEnded', true);
  }

  startTurn() {
    return this.setFlag('nova', 'turnEnded', false);
  }

  
  
}
