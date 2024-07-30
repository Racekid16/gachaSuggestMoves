// given stats for characters, suggest moves for both players
import { printSuggestedMoves } from './prettyPrint.mjs';
import { calculateMoveDamage } from './calculateMoveDamage.mjs';
import { findOptimalSequence } from './findMoveSequence.mjs';

export function suggestMoves(battleObj, programSocket, p1name, p2name, p1char, p2char, turn) {
    let battleKey = p1name + " vs. " + p2name;

    battleObj[battleKey].log(`For turn ${turn+1}:`);
    let [p1moveSequence, p1suggestedMove, p1suggestedMoveObj, p1predictedDamageAmounts, p1hitType] = determineSuggestedMove(battleObj, battleKey, p1name, p2name, p1char, p2char, turn);
    let [p2moveSequence, p2suggestedMove, p2suggestedMoveObj, p2predictedDamageAmounts, p2hitType] = determineSuggestedMove(battleObj, battleKey, p2name, p1name, p2char, p1char, turn);

    printSuggestedMoves(battleObj, programSocket, p1name, p2name, p1char, p2char, p1moveSequence, p2moveSequence, p1suggestedMove, 
    p2suggestedMove, p1suggestedMoveObj, p2suggestedMoveObj, p1predictedDamageAmounts, p2predictedDamageAmounts, p1hitType, p2hitType, turn);
}

function determineSuggestedMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn) {

    let optimalSequence = findOptimalSequence(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn);
    let suggestedMove = optimalSequence.length > 0 ? optimalSequence[0] : "None";
    let [moveObj, damageAmounts, hitType] = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, suggestedMove);

    return [optimalSequence, suggestedMove, moveObj, damageAmounts, hitType];
}