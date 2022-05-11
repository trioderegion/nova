export const NOVA = {};
export const statusEffects = [
  {
    id: 'berserk',
    label: 'NOVA.StatusBerserk',
    icon: 'icons/svg/paralysis.svg',
  },{
    id: 'disrupted',
    label: 'NOVA.StatusDisrupted',
    icon: 'icons/svg/cancel.svg',
  },{
    id: 'flight',
    label: 'NOVA.StatusFlight',
    icon: 'icons/svg/wing.svg',
  },{
    id: 'immune',
    label: 'NOVA.StatusImmune',
    icon: 'icons/svg/aura.svg',
  },{
    id: 'lock',
    label: 'NOVA.StatusLock',
    icon: 'icons/svg/padlock.svg',
  },{
    id: 'protect',
    label: 'NOVA.StatusProtect',
    icon: 'icons/svg/shield.svg',
  },{
    id: 'weaken',
    label: 'NOVA.StatusWeaken',
    icon: 'icons/svg/downgrade.svg',
  },{
    id: 'marked',
    label: 'NOVA.StatusMarked',
    icon: 'icons/svg/target.svg',
  },{
    id: 'stunned',
    label: 'NOVA.StatusStunned',
    icon: 'icons/svg/stoned.svg',
  },{
    id: 'infected',
    label: 'NOVA.StatusInfected',
    icon: 'icons/svg/biohazard.svg',
  },{
    id: 'fear',
    label: 'NOVA.StatusFear',
    icon: 'icons/svg/skull.svg',
  },{
    id: 'damned',
    label: 'NOVA.StatusDamned',
    icon: 'icons/svg/terror.svg',
  },{
    id: 'dormant',
    label: 'NOVA.StatusDormant',
    icon: 'icons/svg/unconscious.svg',
  },
]

// Define constants here, such as:
NOVA.DEFAULTS = {
  NPC_ACTION: {
    harm: ["0", "NOVA.NPCActions.Harm"],
    moves: "NOVA.NPCActions.Moves",
    variants: "NOVA.NPCActions.Variants",
    followers: "NOVA.NPCActions.Follower",
    lair: "NOVA.NPCActions.Lair",
    commands: "NOVA.NPCActions.Commands",
  },
  get HARM_DATA() {
    return {
      get name() {
        return game.i18n.localize("NOVA.Harm.Label"); 
      },
      cost: {value: "1", source: 'data.fuel.value'},
      harm: {value: '0', source: 'data.health.value'},
      target: {type: 'none', value: ''},
      range: {min: 0, max: 0},
      special: "",
      locked: false,
    }
  },
  get CHANGE_DATA() {
    return {
      target: 'harm.value',
      mode: CONST.ACTIVE_EFFECT_MODES.ADD,
      value: '',
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
  1: "NOVA.RangeClose",
  2: "NOVA.RangeNear",
  3: "NOVA.RangeFar",
  4: "NOVA.RangeBeyond"
}

NOVA.costResource = {
  'data.fuel.value': "NOVA.Fuel",
  'data.health.value': "NOVA.Health",
  'data.attributes.sun.value': "NOVA.AttributeSun",
  'data.attributes.moon.value': "NOVA.AttributeMoon",
  'data.attributes.shade.value': "NOVA.AttributeShade"
}

NOVA.modTargets = {
  'NOVA.Harm.Label': 'harm.value',
  'NOVA.Cost': 'cost.value',
  'NOVA.Targets': 'target.value',
  'NOVA.Range': 'range.min',
  'NOVA.RangeMax': 'range.max'
}

NOVA.changeModes = {
  'EFFECT.MODE_ADD': CONST.ACTIVE_EFFECT_MODES.ADD,
  'EFFECT.MODE_MULTIPLY': CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
  'EFFECT.MODE_OVERRIDE': CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
}

NOVA.persistTargets = {
  'NOVA.Health': 'data.health.max',
  'NOVA.Fuel': 'data.fuel.max',
  'NOVA.Sun': 'data.sun.bonus',
  'NOVA.Moon': 'data.moon.bonus',
  'NOVA.Shade': 'data.shade.bonus',
}



NOVA.changeColors = {
  neg: 0xFF0000,
  pos: 0x00FF00
}

NOVA.target = {
  self: "NOVA.TargetSelf",
  ally: "NOVA.TargetAlly",
  enemy: "NOVA.TargetEnemy",
  object: "NOVA.TargetObject",
  any: "NOVA.TargetAny"
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

NOVA.chat = {
  claim: "NOVA.ClaimText"
}

NOVA.drops = {
  none: 'NOVA.DropNone',
  fuel: 'NOVA.DropFuel',
  health: 'NOVA.DropHealth'
}

