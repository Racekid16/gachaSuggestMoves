// determine whether the characters used a move that affects non-resolve stats, 
// where both players used a different character
import { emulateMove } from "./emulateMove.mjs";

export function parseMoveDifferentChars(battleObj, battleKey, attacker, defender, attackChar, 
                                        defenseChar, turnResults, turn, attackerResolves) {

    let moveStr = `\\*\\*${attackChar}\\*\\* used \\*\\*(.+)\\*\\*!`;
    let moveRegex = new RegExp(moveStr);
    let moveMatch = moveRegex.exec(turnResults);
    if (moveMatch !== null) {
        let move = moveMatch[1];
        emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, turnResults, turn, attackerResolves);
        return;
    }

    for (let move of ['Introversion', 'Kabedon', 'Thrill Of The Chase']) {
        if (turnResults.includes(`**${attackChar}** is preparing **${move}**...`)) {
            emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, turnResults, turn, attackerResolves);
            return;
        }
    }
}