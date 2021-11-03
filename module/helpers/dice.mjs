

export async function attributeRoll(attribute, actor) {

  const rollData = actor.getRollData();
  const attributeData = rollData.attributes[attribute];
  const rollString = `${attributeData.value + attributeData.bonus}d6kh`;
  const roll = await (new Roll(rollString, rollData ).evaluate({async:true}));
  await roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: attributeData.label,
    rollMode: game.settings.get('core', 'rollMode'),
  });
  return roll;

}

export function npcRoll(index, actor, actionList, rollFlavor) {
  const content = actionList[index];
  return npcRollMessage(content, rollFlavor, ChatMessage.getSpeaker({ actor }) );
}

function npcRollMessage(content, flavor, speaker){
  return ChatMessage.create({
    content,
    flavor,
    speaker
  });
}
