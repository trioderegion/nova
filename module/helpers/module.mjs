
export class MODULE {

  static isFirstGM(userId = game.user.id) {
    const firstGM = game.users.find( user => user.isGM && user.active );
    return firstGM?.id === userId;
  }

  static hasActiveGM() {
    const firstGM = game.users.find( user => user.isGM && user.active );
    return !!firstGM;
  }
}
