// given stats for characters, suggest moves for both players
import { printSuggestedMoves } from './prettyPrint.mjs';
import consts from '../consts.json' assert { type: 'json' };

export function suggestMoves(battleObj, p1name, p2name, p1char, p2char, turn) {
    let battleKey = p1name + "_vs._" + p2name;

    console.log(`For turn ${turn+1}:`);
    let [p1suggestedMove, p1predictedDamage, p1critical] = determineSuggestedMove(battleObj, battleKey, p1name, p2name, p1char, p2char);
    let [p2suggestedMove, p2predictedDamage, p2critical] = determineSuggestedMove(battleObj, battleKey, p2name, p1name, p2char, p1char);

    printSuggestedMoves(battleObj, p1name, p2name, p1char, p2char, p1suggestedMove, p2suggestedMove, 
                        p1predictedDamage, p2predictedDamage, p1critical, p2critical);
}

function determineSuggestedMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar) {
    let maxDamageMove = '';
    let maxPredictedDamage = -1;
    let isCritical = false;

    for (let move of battleObj[battleKey][attacker].chars[attackChar].moves) {

        let moveObj = consts.moveInfo[move];
        let [predictedDamage, predictedCritical] = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, moveObj);
        
        if (predictedDamage > maxPredictedDamage) {
            maxDamageMove = move;
            maxPredictedDamage = predictedDamage;
            isCritical = predictedCritical;
        }

    }

    return [maxDamageMove, maxPredictedDamage, isCritical];
}

// calculate how much damage a move does. This assumes the move is a type that deals damage,
// and that it is a base type or derives from a base type.
function calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, moveObj) {
    if (typeof moveObj === 'undefined') {
        //console.log(`${move} is not in consts.json`);
        return [-1, false];
    }
    if (!moveObj.isAttack) {
        //console.log(`${move} is not an Attack type move.`);
        return [-1, false];
    }

    let tempMoveObj = structuredClone(moveObj);
    while (typeof tempMoveObj.attackStat === 'undefined') {
        tempMoveObj = structuredClone(consts.moveInfo[tempMoveObj.damageType]);
    }
    let attackStat = tempMoveObj.attackStat;

    tempMoveObj = structuredClone(moveObj);
    while (typeof tempMoveObj.defenseStat === 'undefined') {
        tempMoveObj = structuredClone(consts.moveInfo[tempMoveObj.damageType]);
    }
    let defenseStat = tempMoveObj.defenseStat;

    let attackerAttackStat = battleObj[battleKey][attacker].chars[attackChar][attackStat];
    let defenderDefenseStat = battleObj[battleKey][defender].chars[defenseChar][defenseStat];
    let defenderPersonality = battleObj[battleKey][defender].chars[defenseChar].personality;

    let isCritical = false;
    if (consts.personalityWeaknesses[defenderPersonality].includes(moveObj.damageType)) {
        isCritical = true;
    }

    let damage;
    if (!isCritical) {
        damage = Math.round(36 * attackerAttackStat / defenderDefenseStat) * moveObj.basePower;
    } else {
        damage = Math.round(36 * attackerAttackStat / defenderDefenseStat) * moveObj.basePower * 1.4;
    }

    return [damage, isCritical];
}