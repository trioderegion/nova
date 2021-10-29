

export async function attributeRoll(attribute, actor) {

  const rollData = actor.getRollData();
  const attributeData = rollData.attributes[attribute];
  const rollString = `${attributeData.value}d6kh`;
  let roll = new Roll(rollString, rollData ).roll();
  roll.toMessage({
    speaker: ChatMessage.getSpeaker({ actor }),
    flavor: attributeData.label,
    rollMode: game.settings.get('core', 'rollMode'),
  });
  return roll;

}
