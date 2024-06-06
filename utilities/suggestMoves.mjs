// Given information about the current stats of characters in a battle,
// and the current battleEmbed, suggest moves for players.

export function suggestMoves(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    console.log(`Turn ${turn} of ${battleKey}:\n${battleEmbed.fields[2].value.replaceAll(/\*/g, '')}\n`);
}