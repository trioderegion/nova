

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

export function harmRoll(index, actor) {
  const content = actor.data.data.harm[index];
  return npcRoll(content, "inflicts harm", ChatMessage.getSpeaker({ actor }) );
}

export function moveRoll(index, actor) {
  const content = actor.data.data.moves[index];
  return npcRoll(content, "uses a move", ChatMessage.getSpeaker({actor}));
}

function npcRoll(content, flavor, speaker){
  return ChatMessage.create({
    content,
    flavor,
    speaker
  });
}
