const BaseCombat = foundry.documents.BaseCombat;

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

  /** Overrides **/

  async nextTurn(numTurns = 0) {
    if(numTurns > 0){
      const turn = this.turn + numTurns;
      return this.update({turn});
    }
  }

  setupTurns() {
    // Determine the turn order and the current turn
    const turns = this.combatants.contents.sort(this._sortCombatants);

    this.current = {
      round: this.round,
      turn: this.turn,
    }

    return this.turns = turns;
  }

  /* from a list of combatants, figure out which
   * ones represent "active" NPCs. I.e. NPCs that
   * are being added because they have taken a turn
   * in combat, not because they have been killed
   * and need to generate drops
   */
  static _activeNpcs(combatants) {
    const numActive = combatants.reduce( (acc, curr) => {
      if (curr.category.activeNpc) {
        acc++;
      }
      return acc;
    },0);

    return numActive;
  }

  async incrementRound(num) {
    /* reset to player turn */
    const turn = 0;
    const round = this.round + num;

    let npcIds = [];
    for(const combatant of this.combatants){
      if (combatant.actor.type == 'npc') {
        npcIds.push(combatant.id);
      } else {
        await combatant.startTurn();
      }
    }

    /* remove any NPCs from the tracker for new round */
    await this.deleteEmbeddedDocuments('Combatant', npcIds);

    return this.update({round, turn});
  }

  nextRound() {
    return this.incrementRound(1);
  }

  previousRound() {
    return this.incrementRound(-1); 
  }

  async rollAllDrops() {
    for(const combatant of this.combatants) {
      if(combatant.category.dropNpc) {
        await this.handleRollDrop(combatant);
      }
    }
  }

  async allEndTurn() {
    for(const combatant of this.combatants) {
      if(!combatant.category.npc) {
        await combatant.endTurn();  
      }
    }
  }

  async handleRollDrop(combatant) {
      const actor = combatant.actor;
      const token = combatant.token;
      await combatant.delete();
      await token?.update({hidden: true});
      return actor?.rollDrop();
  }

  resetAll() {
    return this.incrementRound(0);
  }

  /** @inheritdoc */
  _onCreateEmbeddedDocuments(type, documents, result, options, userId) {

    /* kind of naughty, but the parts of 'Combat' that we do want are much
     * more than the parts we dont want. This is a don't want */
    if (BaseCombat.prototype._onCreateEmbeddedDocuments) {
      const args = [type, documents, result, options, userId];
      Reflect.apply(BaseCombat.prototype._onCreateEmbeddedDocuments, this, args);
    }
    
    // Update the turn order and adjust the combat to keep the combatant the same
    this.setupTurns();

    /* count number of new active NPCs (as opposed to NPCs added
     * for drop tracking */
    const turn = this.turn + NovaCombat._activeNpcs(documents);    

    /* update the turn in the DB or update it locally */
    if ( game.user.id === userId ) this.update({turn});
    else this.updateSource({turn});

    // Render the collection
    if ( this.active ) this.collection.render();
  }

  /** @inheritdoc */
  _onDeleteEmbeddedDocuments(embeddedName, documents, result, options, userId) {

    /* kind of naughty, but the parts of 'Combat' that we do want are much
     * more than the parts we dont want. This is a don't want */
    if (BaseCombat.prototype._onDeleteEmbeddedDocuments) {
      const args = [embeddedName, documents, result, options, userId];
      Reflect.apply(BaseCombat.prototype._onDeleteEmbeddedDocuments, this, args);
    }

    this.setupTurns();

    const turn = this.turn - NovaCombat._activeNpcs(documents);

    // Update database or perform a local override
    if ( game.user.id === userId ) this.update({turn});
    else this.updateSource({turn});

    // Render the collection
    if ( this.active ) this.collection.render();
  }
}
