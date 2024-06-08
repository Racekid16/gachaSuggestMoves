// given stats for characters, suggest moves for both players
import consts from '../consts.json' assert { type: 'json' };

export function suggestMoves(battleObj, p1name, p2name, p1char, p2char, turn) {
    let battleKey = p1name + "_vs._" + p2name;

    console.log(`For turn ${turn+1}:`);
    let [p1suggestedMove, p1predictedDamage] = suggestMove(battleObj, battleKey, p1name, p2name, p1char, p2char);
    let [p2suggestedMove, p2predictedDamage] = suggestMove(battleObj, battleKey, p2name, p1name, p2char, p1char);

    printSuggestedMoves(battleObj, p1name, p2name, p1char, p2char, p1suggestedMove, 
                        p2suggestedMove, p1predictedDamage, p2predictedDamage);
}

function suggestMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar) {
    let maxPredictedDamage = -1;
    let maxDamageMove = '';

    for (let move of battleObj[battleKey][attacker].chars[attackChar].moves) {
        let moveObj = consts.moveInfo[move];
        if (typeof moveObj === 'undefined') {
            continue;
        }
        let predictedDamage = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, moveObj);
        if (predictedDamage > maxPredictedDamage) {
            maxPredictedDamage = predictedDamage;
            maxDamageMove = move;
        }
    }

    return [maxDamageMove, maxPredictedDamage];
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
        damage = Math.round(36 * attackerAttackStat / defenderAttackStat) * moveObj.basePower * 1.4;
    }

    return damage;
}

// a lot of this is unnecessary, but it makes the print-outs easier to read
function printSuggestedMoves(battleObj, p1name, p2name, p1char, p2char, p1move, p2move, p1damage, p2damage) {
    let battleKey = p1name + "_vs._" + p2name;

    let playerNameLength = p1name.length > p2name.length ? p1name.length : p2name.length;
    let p1initiative = battleObj[battleKey][p1name].chars[p1char].initiative;
    let p2initiative = battleObj[battleKey][p2name].chars[p2char].initiative;
    let initiativeLength = p1initiative.toString().length > p2initiative.toString().length ?
                           p1initiative.toString().length : p2initiative.toString().length;
    let charNameLength = p1char.length > p2char.length ? p1char.length : p2char.length;
    let moveNameLength = p1move.length > p2move.length ? p1move.length: p2move.length;
    let p1lowerBound = Math.round(p1damage * 0.8);
    let p1upperBound = Math.round(p1damage * 1.2);
    let p2lowerBound = Math.round(p2damage * 0.8);
    let p2upperBound = Math.round(p2damage * 1.2);
    let lowerBoundLength = p1lowerBound.toString().length > p2lowerBound.toString().length ? 
                           p1lowerBound.toString().length : p2lowerBound.toString().length;
    let upperBoundLength = p1upperBound.toString().length > p2upperBound.toString().length ?
                           p1upperBound.toString().length : p2upperBound.toString().length;
    let p1resolve = battleObj[battleKey][p1name].chars[p1char].resolve;
    let p2resolve = battleObj[battleKey][p2name].chars[p2char].resolve;
    let p1fatal = p1lowerBound > p2resolve ? ' FATAL' : '';
    let p2fatal = p2lowerBound > p1resolve ? ' FATAL' : '';
    
    if (p1initiative >= p2initiative) {
        console.log(`${p1name} ${" ".repeat(playerNameLength - p1name.length)}` 
                  + `[${p1char}${" ".repeat(charNameLength - p1char.length)} `
                  + `${p1initiative}${" ".repeat(initiativeLength - p1initiative.toString().length)}]: `
                  + `${p1move} ${" ".repeat(moveNameLength - p1move.length)}`
                  + `(${p1lowerBound} ${" ".repeat(lowerBoundLength - p1lowerBound.toString().length)}- `
                  + `${p1upperBound}${" ".repeat(upperBoundLength - p1upperBound.toString().length)})`
                  + `${p1fatal}`);
        console.log(`${p2name} ${" ".repeat(playerNameLength - p2name.length)}` 
                  + `[${p2char}${" ".repeat(charNameLength - p2char.length)} `
                  + `${p2initiative}${" ".repeat(initiativeLength - p2initiative.toString().length)}]: `
                  + `${p2move} ${" ".repeat(moveNameLength - p2move.length)}`
                  + `(${p2lowerBound} ${" ".repeat(lowerBoundLength - p2lowerBound.toString().length)}- `
                  + `${p2upperBound}${" ".repeat(upperBoundLength - p2upperBound.toString().length)})`
                  + `${p2fatal}`);
    } else {    //p1initiative < p2initiative
        console.log(`${p2name} ${" ".repeat(playerNameLength - p2name.length)}` 
                  + `[${p2char}${" ".repeat(charNameLength - p2char.length)} `
                  + `${p2initiative}${" ".repeat(initiativeLength - p2initiative.toString().length)}]: `
                  + `${p2move} ${" ".repeat(moveNameLength - p2move.length)}`
                  + `(${p2lowerBound} ${" ".repeat(lowerBoundLength - p2lowerBound.toString().length)}- `
                  + `${p2upperBound}${" ".repeat(upperBoundLength - p2upperBound.toString().length)})`
                  + `${p2fatal}`);
        console.log(`${p1name} ${" ".repeat(playerNameLength - p1name.length)}` 
                  + `[${p1char}${" ".repeat(charNameLength - p1char.length)} `
                  + `${p1initiative}${" ".repeat(initiativeLength - p1initiative.toString().length)}]: `
                  + `${p1move} ${" ".repeat(moveNameLength - p1move.length)}`
                  + `(${p1lowerBound} ${" ".repeat(lowerBoundLength - p1lowerBound.toString().length)}- `
                  + `${p1upperBound}${" ".repeat(upperBoundLength - p1upperBound.toString().length)})`
                  + `${p1fatal}`);
    }
}