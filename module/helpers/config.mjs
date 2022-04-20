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
  POWER_DATA: {
    cost: 1,
    harm: 0,
    target: "NOVA.None",
    quantity: 0,
    band: "NOVA.BandAt",
    range: 0,
    special: "",
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

