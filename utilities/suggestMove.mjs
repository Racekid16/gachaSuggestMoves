// given stats for characters, suggest moves for both players
import consts from '../consts.json' assert { type: 'json' };

export function suggestMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn) {
    let maxPredictedDamage = -1;
    let isCritical = '';
    let maxDamageMove = '';

    for (let move of battleObj[battleKey][attacker].chars[attackChar].moves) {
        let moveObj = consts.moveInfo[move];
        if (typeof moveObj === 'undefined') {
            continue;
        }
        let [predictedDamage, predictedCritical] = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, moveObj);
        if (predictedDamage > maxPredictedDamage) {
            maxPredictedDamage = predictedDamage;
            predictedCritical ? isCritical = '(CRITICAL)' : isCritical = '';
            maxDamageMove = move;
        }
    }

    let damageLowerBound = Math.round(maxPredictedDamage * 0.8);
    let damageUpperBound = Math.round(maxPredictedDamage * 1.2);
    console.log(`Turn ${turn+1}: ${attacker} should use ${maxDamageMove} with damage ${damageLowerBound}-${damageUpperBound} ${isCritical}`);

    let attackCharInitiative = battleObj[battleKey][attacker].chars[attackChar].initiative;
    return attackCharInitiative;
}

function calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, moveObj) {
    let attackerAttackStat = battleObj[battleKey][attacker].chars[attackChar][moveObj.attackStat];
    let defenderAttackStat = battleObj[battleKey][defender].chars[defenseChar][moveObj.attackStat];
    let defenderPersonality = battleObj[battleKey][defender].chars[defenseChar].personality;

    let isCritical = false;
    if (consts.personalityWeaknesses[defenderPersonality].includes(moveObj.name)) {
        isCritical = true;
    }

    let damage;
    if (!isCritical) {
        damage = Math.round(36 * attackerAttackStat / defenderAttackStat) * moveObj.basePower;
    } else {
        damage = Math.round(36 * attackerAttackStat / defenderAttackStat) * moveObj.basePower * 1.2;
    }

    return [damage, isCritical];
}