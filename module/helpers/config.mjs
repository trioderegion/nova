export const NOVA = {};

// Define constants here, such as:
NOVA.DEFAULTS = {
    harm: "0 Harm",
    moves: "New Move"
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

