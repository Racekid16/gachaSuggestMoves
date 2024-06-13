// given stats for characters, suggest moves for both players
import { printSuggestedMoves, getBaseMoveObj } from './prettyPrint.mjs';
import { round } from './round.mjs';
import consts from '../consts.json' assert { type: 'json' };

export function suggestMoves(battleObj, p1name, p2name, p1char, p2char, turn) {
    let battleKey = p1name + "_vs._" + p2name;

    battleObj[battleKey].log(`For turn ${turn+1}:`);
    let [p1suggestedMove, p1predictedDamage, p1critical] = determineSuggestedMove(battleObj, battleKey, p1name, p2name, p1char, p2char);
    let [p2suggestedMove, p2predictedDamage, p2critical] = determineSuggestedMove(battleObj, battleKey, p2name, p1name, p2char, p1char);

    printSuggestedMoves(battleObj, p1name, p2name, p1char, p2char, p1suggestedMove, p2suggestedMove, 
                        p1predictedDamage, p2predictedDamage, p1critical, p2critical);
}

function determineSuggestedMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar) {
    let maxDamageMove = '';
    let maxPredictedDamage = -Infinity;
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
    if (!moveObj.type.includes('attack')) {
        //console.log(`${move} is not an Attack type move.`);
        return [-1, false];
    }

    let baseMoveObj = getBaseMoveObj(moveObj);
    let attackStat = typeof moveObj.attackStat === 'undefined' ? baseMoveObj.attackStat : moveObj.attackStat;
    let defenseStat = typeof moveObj.defenseStat === 'undefined' ? baseMoveObj.defenseStat : moveObj.defenseStat;
    let basePower = typeof moveObj.basePower === 'undefined' ? baseMoveObj.basePower : moveObj.basePower;

    let attackerAttackStat = battleObj[battleKey][attacker].chars[attackChar][attackStat];
    let defenderDefenseStat = battleObj[battleKey][defender].chars[defenseChar][defenseStat];
    let defenderPersonality = battleObj[battleKey][defender].chars[defenseChar].personality;

    let isCritical = false;
    if (consts.personalityWeaknesses[defenderPersonality].includes(moveObj.damageType)) {
        isCritical = true;
    }

    let damage;
    //this is a guess for how much damage will be dealt, since I don't know the exact damage formula
    if (!isCritical) {
        damage = round(36 * attackerAttackStat / defenderDefenseStat) * basePower;
    } else {
        damage = round(36 * attackerAttackStat / defenderDefenseStat) * basePower * 1.4;
    }

    return [damage, isCritical];
}