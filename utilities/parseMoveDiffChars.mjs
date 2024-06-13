// determine whether the characters used a move that affects non-resolve stats, 
// where both players used a different character
import { emulateMove } from "./emulateMove.mjs";

export function parseMoveDifferentChars(battleObj, battleKey, attacker, defender, attackChar, 
                                 defenseChar, turnResults, turn, attackerResolves) {
    let attackerID = battleObj[battleKey][attacker].id;
    let previousTaggedInChar = battleObj[battleKey][attacker].previousTaggedInChar;

    for (let move of ['Arrogance', 'Blazing Form', 'Charm', 'Dominate', 'From The Shadows', 'Hate',
                      'Humiliate', 'Kings Command', 'Provoke', 'Slap', 'Slumber', 'Study', 'Unity']) {
        if (turnResults.includes(`**${attackChar}** used **${move}**!`)) {
            emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, turnResults, turn, attackerResolves);
        }
    }

    for (let move of ['Introversion', 'Kabedon']) {
        if (turnResults.includes(`**${attackChar}** is preparing **${move}**...`)) {
            emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, turnResults, turn, attackerResolves);
        }
    }

    if (previousTaggedInChar !== null && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Boss Orders") 
     && attackerResolves[previousTaggedInChar] == 0) {
        emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Boss Orders", turnResults, turn, attackerResolves);
    }

    if (turnResults.includes(`**<@${attackerID}>** tagged in **${attackChar}**!`) && previousTaggedInChar !== null 
     && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Lead By Example")) {
        emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Lead By Example", turnResults, turn, attackerResolves);
    }

    // handle both The Perfect Existence and Kabedon tagging in here
    let taggedInStr = `\\*\\*<@${attackerID}>\\**\\** tagged in \\*\\*(.+)\\*\\*!`;
    let taggedInRegex = new RegExp(taggedInStr);
    let taggedInMatch = taggedInRegex.exec(turnResults);
    if (taggedInMatch !== null) {
        let taggedInChar = taggedInMatch[1];
        emulateMove(battleObj, battleKey, attacker, defender, taggedInChar, defenseChar, "Tag-in", turnResults, turn, attackerResolves);
    }

    if (turnResults.includes(`**${attackChar}**'s **Initiative** was boosted!`)
     && battleObj[battleKey][attacker].chars[attackChar].moves.includes("Zenith Pace")) {
        emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Zenith Pace", turnResults, turn, attackerResolves);
    }
}