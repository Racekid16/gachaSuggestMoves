// given stats for characters, suggest moves for both players
import { printSuggestedMoves } from './prettyPrint.mjs';
import { calculateMoveDamage } from './calculateMoveDamage.mjs';
import { findOptimalSequenceNoDefender } from './findMoveSequence.mjs';

export function suggestMoves(battleObj, p1name, p2name, p1char, p2char, turn) {
    let battleKey = p1name + " vs. " + p2name;

    battleObj[battleKey].log(`For turn ${turn+1}:`);
    let [p1suggestedMove, p1suggestedMoveObj, p1predictedDamage, p1critical] = determineSuggestedMove(battleObj, battleKey, p1name, p2name, p1char, p2char);
    let [p2suggestedMove, p2suggestedMoveObj, p2predictedDamage, p2critical] = determineSuggestedMove(battleObj, battleKey, p2name, p1name, p2char, p1char);

    printSuggestedMoves(battleObj, p1name, p2name, p1char, p2char, p1suggestedMove, p2suggestedMove, 
    p1suggestedMoveObj, p2suggestedMoveObj, p1predictedDamage, p2predictedDamage, p1critical, p2critical);

    //TODO: do this properly, this is temporary
    findOptimalSequenceNoDefender(battleObj, battleKey, p1name, p2name, p1char, p2char);
    findOptimalSequenceNoDefender(battleObj, battleKey, p2name, p1name, p2char, p1char);
}

function determineSuggestedMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar) {
    let maxDamageMove = '';
    let maxDamageMoveObj = {};
    let maxPredictedDamage = -9999;
    let isCritical = false;

    for (let move of battleObj[battleKey][attacker].chars[attackChar].moves) {
        let [moveObj, predictedDamage, predictedCritical] = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move);
        
        if (predictedDamage > maxPredictedDamage) {
            maxDamageMove = move;
            maxDamageMoveObj = moveObj;
            maxPredictedDamage = predictedDamage;
            isCritical = predictedCritical;
        }

    }

    return [maxDamageMove, maxDamageMoveObj, maxPredictedDamage, isCritical];
}