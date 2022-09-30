export const NOVA = {};
export const statusEffects = [
  {
    id: 'aura',
    label: 'NOVA.StatusAura',
    icon: 'icons/svg/radiation.svg',
  },{
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
    icon: 'icons/svg/terror.svg',
  },{
    id: 'damned',
    label: 'NOVA.StatusDamned',
    icon: 'icons/svg/bones.svg',
  },{
    id: 'dormant',
    label: 'NOVA.StatusDormant',
    icon: 'icons/svg/unconscious.svg',
  },{
    id: 'bleeding',
    label: 'NOVA.StatusBleeding',
    icon: 'icons/svg/blood.svg',
  },{
    id: 'blind',
    label: 'NOVA.StatusBlind',
    icon: 'icons/svg/blind.svg',
  },{
    id: 'taunted',
    label: 'NOVA.StatusTaunted',
    icon: 'icons/svg/combat.svg',
  },{
    id: 'hidden',
    label: 'NOVA.StatusHidden',
    icon: 'icons/svg/cowled.svg',
  },{
    id: 'exposed',
    label: 'NOVA.StatusExposed',
    icon: 'icons/svg/eye.svg',
  },{
    id: 'burning',
    label: 'NOVA.StatusBurning',
    icon: 'icons/svg/fire.svg',
  },{
    id: 'frozen',
    label: 'NOVA.StatusFrozen',
    icon: 'icons/svg/frozen.svg',
  },{
    id: 'alerted',
    label: 'NOVA.StatusAlerted',
    icon: 'icons/svg/hazard.svg',
  },{
    id: 'immobilized',
    label: 'NOVA.StatusImmobilized',
    icon: 'icons/svg/net.svg',
  },{
    id: 'empowered',
    label: 'NOVA.StatusEmpowered',
    icon: 'icons/svg/sword.svg',
  }
]

// Define constants here, such as:
NOVA.DEFAULTS = {
  NPC_ACTION: {
    get harm() {
      return ["0", game.i18n.localize("NOVA.NPCActions.Harm"), ''];
    },
    get moves() { return game.i18n.localize("NOVA.NPCActions.Moves") },
    get variants() { return game.i18n.localize("NOVA.NPCActions.Variants") },
    get followers() { return game.i18n.localize("NOVA.NPCActions.Follower") },
    get lair() { return game.i18n.localize("NOVA.NPCActions.Lair") },
    get commands() { return game.i18n.localize("NOVA.NPCActions.Commands")},
  },
  get HARM_DATA() {
    return {
      get name() {
        return game.i18n.localize("NOVA.Harm.Label"); 
      },
      cost: {value: "1", source: 'system.fuel.value'},
      harm: {value: '0', source: 'system.health.value'},
      target: {type: 'none', value: ''},
      range: {min: 0, max: 0},
      special: "",
      status: {
        self: '',
        target: ''
      },
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
  'system.fuel.value': "NOVA.Fuel",
  'system.health.value': "NOVA.Health",
  'system.attributes.sun.value': "NOVA.AttributeSun",
  'system.attributes.moon.value': "NOVA.AttributeMoon",
  'system.attributes.shade.value': "NOVA.AttributeShade"
}

NOVA.modTargets = {
  'NOVA.Harm.Label': 'harm.value',
  'NOVA.Cost': 'cost.value',
  'NOVA.Targets': 'target.value',
  'NOVA.Range': 'range.min',
  'NOVA.RangeMax': 'range.max',
  'NOVA.StatusSelf': 'status.self',
  'NOVA.StatusTarget': 'status.target',
}

NOVA.changeModes = {
  'EFFECT.MODE_ADD': CONST.ACTIVE_EFFECT_MODES.ADD,
  'EFFECT.MODE_MULTIPLY': CONST.ACTIVE_EFFECT_MODES.MULTIPLY,
  'EFFECT.MODE_OVERRIDE': CONST.ACTIVE_EFFECT_MODES.OVERRIDE,
}

NOVA.persistTargets = {
  'NOVA.Health': 'system.health.max',
  'NOVA.Fuel': 'system.fuel.max',
  'NOVA.AttributeSun': 'system.attributes.sun.bonus',
  'NOVA.AttributeMoon': 'system.attributes.moon.bonus',
  'NOVA.AttributeShade': 'system.attributes.shade.bonus',
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

