
export class NovaCombat extends Combat {

  //async _preCreate(data, options, user) {
  //  await super._preCreate(data, options, user);
  //}

  isPlayerTurn() {
    /* if even one combatant hasn't header
     * their turn ended, then it is still
     * the players' turn
     */
    const found = this.turns.find( combatant => !combatant.turnEnded && combatant.actor.type == 'spark' )

    return !!found;
  }

  async nextRound() {
    /* reset to player turn */
    const turn = 0;
    const round = this.round + 1;

    for(const combatant of this.combatants){
      await combatant.startTurn();
    }

    return this.update({round, turn});
  }
  
}
