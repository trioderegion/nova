export const NOVA = {};

// Define constants here, such as:
NOVA.DEFAULTS = {
  NPC_ACTION: {
    harm: "NOVA.NPCActions.Harm",
    moves: "NOVA.NPCActions.Moves",
    variants: "NOVA.NPCActions.Variants",
    followers: "NOVA.NPCActions.Follower",
    lair: "NOVA.NPCActions.Lair",
    commands: "NOVA.NPCActions.Commands",
  },
  get HARM_DATA() {
    return {
      get name() {
        return game.i18n.localize("PERMISSION.DEFAULT"); 
      },
      cost: {value: 1, source: 'data.fuel.value'},
      harm: 0,
      target: {type: 'none', num: 0},
      range: {min: 0, max: 0},
      special: "",
    }
  }
}

/**
 * The set of Ability Scores used within the sytem.
 * @type {Object}
 */
NOVA.attributes = {
  sun: "NOVA.AttributeSun",
  moon: "NOVA.AttributeMoon",
  shade: "NOVA.AttributeShade",
};

NOVA.range = {
  none: "NOVA.None",
  close: "NOVA.RangeClose",
  near: "NOVA.RangeNear",
  far: "NOVA.RangeFar",
  beyond: "NOVA.RangeBeyond"
}

NOVA.costResource = {
  '': "NOVA.None",
  'data.fuel.value': "NOVA.Fuel",
  'data.health.value': "NOVA.Health",
  'data.attributes.sun.value': "NOVA.AttributeSun",
  'data.attributes.moon.value': "NOVA.AttributeMoon",
  'data.attributes.shade.value': "NOVA.AttributeShade"
}

NOVA.target = {
  none: "NOVA.None",
  self: "NOVA.TargetSelf",
  ally: "NOVA.TargetAlly",
  enemy: "NOVA.TargetEnemy",
  object: "NOVA.TargetObject",
  any: "NOVA.TargetAny"
}

NOVA.rangeIncrements = ['none', 'close', 'near', 'far', 'beyond']

NOVA.powerType = {
  passive: "NOVA.PowerPassive",
  active: "NOVA.PowerActive",
  supernova: "NOVA.PowerSupernova"
}

NOVA.flareType = {
  persistent: "NOVA.FlarePersistent",
  power: "NOVA.FlarePower"
}

NOVA.npcActions = {
  harm: "NOVA.Harm",
  moves: "NOVA.Moves",
  variants: "NOVA.Variants",
  followers: "NOVA.Followers",
  lair: "NOVA.Lair",
  commands: "NOVA.Commands"
}

NOVA.chat = {
  claim: "NOVA.ClaimText"
}

NOVA.drops = {
  none: 'NOVA.DropNone',
  fuel: 'NOVA.DropFuel',
  health: 'NOVA.DropHealth'
}

