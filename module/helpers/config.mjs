export const NOVA = {};

// Define constants here, such as:
NOVA.CONST = {
  RANGE: {
    NONE: 0,
    CLOSE: 1,
    NEAR: 2,
    FAR: 3,
    BEYOND: 4
  }
 
};

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

