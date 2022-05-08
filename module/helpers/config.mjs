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
        return game.i18n.localize("NOVA.Harm.Label"); 
      },
      cost: {value: "1", source: 'data.fuel.value'},
      harm: {value: '0', source: 'data.health.value'},
      target: {type: 'none', value: ''},
      range: {min: '', max: ''},
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
  'data.fuel.value': "NOVA.Fuel",
  'data.health.value': "NOVA.Health",
  'data.attributes.sun.value': "NOVA.AttributeSun",
  'data.attributes.moon.value': "NOVA.AttributeMoon",
  'data.attributes.shade.value': "NOVA.AttributeShade"
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

