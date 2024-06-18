// determine whether the characters used a move that affects non-resolve stats, 
// where both players used a different character
import { emulateMove } from "./emulateMove.mjs";

export function parseMoveDifferentChars(battleObj, battleKey, attacker, defender, attackChar, 
                                        defenseChar, turnResults, turn, attackerResolves) {

    for (let move of ['Arrogance', 'Blazing Form', 'Bottle Break', 'Charm', 'Dominate', 'From The Shadows', 'Hate',
                      'Humiliate', 'Kings Command', 'Provoke', 'Slap', 'Slumber', 'Study', 'Unity']) {
        if (turnResults.includes(`**${attackChar}** used **${move}**!`)) {
            emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, turnResults, turn, attackerResolves);
            return;
        }
    }

    for (let move of ['Introversion', 'Kabedon']) {
        if (turnResults.includes(`**${attackChar}** is preparing **${move}**...`)) {
            emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, turnResults, turn, attackerResolves);
            return;
        }
    }

}