import { round } from './round.mjs';
import consts from '../consts.json' assert { type: 'json' };

// calculate how much damage a move does. This assumes the move is a type that deals damage,
// and that it is a base type or derives from a base type.
export function calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move) {
    const moveObj = consts.moveInfo[move];
    if (typeof moveObj === 'undefined') {
        console.log(move, 'is not in consts.json');
        console.log(battleObj[battleKey][attacker].chars[attackChar]);
        return [{}, -1, ''];
    }
    if (!moveObj.type.includes('attack')) {
        //console.log(`${move} is not an Attack type move.`);
        return [moveObj, 0, ''];
    }

    let completeMoveObj = getCompleteMoveObj(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move);
    let damage;
    let hitType = '';
    let defenderPersonality = battleObj[battleKey][defender].chars[defenseChar].personality;
    let attackerCombatStatAverage = round((battleObj[battleKey][attacker].chars[attackChar].mental
                                         + battleObj[battleKey][attacker].chars[attackChar].physical
                                         + battleObj[battleKey][attacker].chars[attackChar].social) / 3);
    let defenderCombatStatAverage = round((battleObj[battleKey][defender].chars[defenseChar].mental
                                         + battleObj[battleKey][defender].chars[defenseChar].physical
                                         + battleObj[battleKey][defender].chars[defenseChar].social) / 3);
    
    let attackerAttackStat;
    if (completeMoveObj.attackStat == "Combat stat average") {
        attackerAttackStat = attackerCombatStatAverage;
    } else {
        attackerAttackStat = battleObj[battleKey][attacker].chars[attackChar][completeMoveObj.attackStat];
    }
    let attackerInflictMultiplier = battleObj[battleKey][attacker].chars[attackChar].inflictMultiplier;
    if (consts.personalityWeaknesses[defenderPersonality].includes(completeMoveObj.damageType)) {
        attackerInflictMultiplier += 0.4;
        if (battleObj[battleKey][attacker].chars[attackChar].rune == "Glass") {
            attackerInflictMultiplier += 0.75;
        }
        if (battleObj[battleKey][defender].chars[defenseChar].rune == "Glass") {
            attackerInflictMultiplier += 0.75;
        }
        hitType = 'CRITICAL';
    }
    let attackPower = attackerAttackStat * attackerInflictMultiplier * completeMoveObj.basePower;

    let defenderDefenseStat;
    if (completeMoveObj.defenseStat == "Combat stat average") {
        defenderDefenseStat = defenderCombatStatAverage;
    } else {
        defenderDefenseStat = battleObj[battleKey][defender].chars[defenseChar][completeMoveObj.defenseStat];
    }
    let defenderReceiveMultiplier = battleObj[battleKey][defender].chars[defenseChar].receiveMultiplier;
    if (consts.personalityResistances[defenderPersonality].includes(completeMoveObj.damageType)) {
        defenderReceiveMultiplier += 0.4;
        hitType = 'RESISTED';
    }
    let defensePower = defenderDefenseStat * defenderReceiveMultiplier;
    
    //this is a guess for how much damage will be dealt, since I don't know the exact damage formula
    if (defensePower != 0) {
        damage = Math.min(
            round(40 * (attackPower / defensePower)),
            round(40 * (attackPower / defensePower) ** 0.85)
        );
    } else {
        damage = round(2 * attackPower);
    }

    return [completeMoveObj, damage, hitType];
}

//return: an array of characters and how much they heal for, format: [moveObj, healAmounts] (both objects)
export function calculateMoveHealing(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move) {
    const moveObj = consts.moveInfo[move];
    if (typeof moveObj === 'undefined') {
        console.log(move, 'is not in consts.json');
        console.log(battleObj[battleKey][attacker].chars[attackChar]);
        return [{}, -1];
    }

    let currentResolve = battleObj[battleKey][attacker].chars[attackChar].resolve;
    let maxResolve = battleObj[battleKey][attacker].chars[attackChar].maxResolve;
    let healAmounts = {};

    switch (move) {
        case 'Bottle Break':
            let bottleBreakHealPercent = 0.2;
            healAmounts[attackChar] = Math.min(maxResolve, currentResolve + round(maxResolve * bottleBreakHealPercent)) - currentResolve;
            break;
        
        case 'Group Determination':
            let selfHealPercent = 0;
            let otherHealPercent = 0.25;
            for (let charKey in battleObj[battleKey][attacker].chars) {
                if (battleObj[battleKey][attacker].chars[charKey].tags.includes("Ayanokōji Group")) {
                    selfHealPercent += 0.25;
                    let charCurrentResolve = battleObj[battleKey][attacker].chars[charKey].resolve;
                    if (charCurrentResolve != 0) {
                        let charMaxResolve = battleObj[battleKey][attacker].chars[charKey].maxResolve;
                        healAmounts[charKey] = Math.min(charMaxResolve, charCurrentResolve + round(charMaxResolve * otherHealPercent)) - charCurrentResolve;
                    }
                }
            }
            healAmounts[attackChar] = round(maxResolve * selfHealPercent);
            break;

        case 'Inspire':
            let inspireHealPercent = 0.33;
            for (let charKey in battleObj[battleKey][attacker].chars) {
                if (charKey != attackChar && battleObj[battleKey][attacker].chars[charKey].resolve != 0) {
                    let charCurrentResolve = battleObj[battleKey][attacker].chars[charKey].resolve;
                    let charMaxResolve = battleObj[battleKey][attacker].chars[charKey].maxResolve;
                    healAmounts[charKey] = Math.min(charMaxResolve, charCurrentResolve + round(charMaxResolve * inspireHealPercent)) - charCurrentResolve;
                }
            }
            break;
        
        case 'Introversion':
            let introversionHealPercent = 0.4;
            for (let charKey in battleObj[battleKey][attacker].chars) {
                if (charKey != attackChar && battleObj[battleKey][attacker].chars[charKey].resolve != 0) {
                    healAmounts[attackChar] = Math.min(maxResolve, currentResolve + round(maxResolve * introversionHealPercent)) - currentResolve;
                }
            }
            break;
        
        case 'Shatter':
            let defenderResolve = battleObj[battleKey][defender].chars[defenseChar].resolve;
            let shatterDamage = Math.min(defenderResolve, calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move)[1]);
            let shatterHealPercent = 0.35;
            let numSecrets = 0;
            if (typeof battleObj[battleKey][attacker].chars[attackChar].secrets !== 'undefined') {
                numSecrets = battleObj[battleKey][attacker].chars[attackChar].secrets.size;
            }
            if (numSecrets >= 2) {
                healAmounts[attackChar] = Math.min(maxResolve, currentResolve + round(shatterDamage * shatterHealPercent)) - currentResolve;            
            }
            break;
        
        case 'Teamwork':
            let teamworkHealPercent = 0.2;
            let previousTaggedInChar = battleObj[battleKey][attacker].previousTaggedInChar;
            let previousTaggedInCharObj = battleObj[battleKey][attacker].chars[previousTaggedInChar];
            if (previousTaggedInCharObj.tags.includes("Class D")) {
                healAmounts[attackChar] = Math.min(maxResolve, currentResolve + round(maxResolve * teamworkHealPercent)) - currentResolve;
            }
            break;
        
        case 'The Perfect Existence':
            let thePerfectExistenceHealPercent = 0.5;
            healAmounts[attackChar] = round(maxResolve * thePerfectExistenceHealPercent);
            break;
        
        case 'Unmask':
            let unmaskHealPercent = 0.4;
            healAmounts[attackChar] = Math.min(maxResolve, currentResolve + round(maxResolve * unmaskHealPercent)) - currentResolve;
            break;
        
        default:
            break;

    }

    return [moveObj, healAmounts];
}

export function getCompleteMoveObj(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move) {
    let moveObj = structuredClone(consts.moveInfo[move]);
    if (typeof moveObj.damageType === "undefined") {
        return moveObj;
    }
    moveObj.damageType = getDamageType(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj);
    const baseMoveObj = consts.moveInfo[moveObj.damageType];
    let completeMoveObj = structuredClone(moveObj);

    completeMoveObj.attackStat = getAttackStat(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj);
    completeMoveObj.defenseStat = getDefenseStat(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj);
    completeMoveObj.basePower = getBasePower(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj);
    completeMoveObj.priority = getPriority(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj);
    return completeMoveObj;
}

function getDamageType(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj) {
    let returnVal = moveObj.damageType;
    if (returnVal == "varies") {
        switch (move) {
            case 'Impulse':
                const attackStats = ['mental', 'physical', 'social'];
                let highestAttackStat = attackStats.reduce((highest, current) => {
                    let thisStat = battleObj[battleKey][attacker].chars[attackChar][current];
                    let highestStat = battleObj[battleKey][attacker].chars[attackChar][highest];
                    return thisStat > highestStat ? current : highest;
                }, attackStats[0]);
                let correspondingDamageType = {
                    "mental": "Academic",
                    "physical": "Athleticism",
                    "social": "Empathy"
                };
                returnVal = correspondingDamageType[highestAttackStat];
                break;
            
            default:
                console.log(`There is no specific case to determine the damage type of ${move}`);
                break;
        }
    }
    return returnVal;
}

function getAttackStat(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj) {
    let returnVal = typeof moveObj.attackStat === 'undefined' ? baseMoveObj.attackStat : moveObj.attackStat;
    const attackStats = ['mental', 'physical', 'social'];

    if (returnVal == "varies") {
        switch (move) {
            case 'Impulse':
                returnVal =  attackStats.reduce((highest, current) => {
                    let thisStat = battleObj[battleKey][attacker].chars[attackChar][current];
                    let highestStat = battleObj[battleKey][attacker].chars[attackChar][highest];
                    return thisStat > highestStat ? current : highest;
                }, attackStats[0]);
                break;
            
            default:
                console.log(`There is no specific case to determine the attack stat of ${move}`);
                break;
        }
    }
    return returnVal;
}

function getDefenseStat(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj) {
    let returnVal = typeof moveObj.defenseStat === 'undefined' ? baseMoveObj.defenseStat : moveObj.defenseStat;

    if (returnVal == "varies") {
        switch (move) {
            case 'Impulse':
                returnVal = completeMoveObj.attackStat;
                break;

            case 'Obliterate':
                returnVal = 'Combat stat average';
                break;

            default:
                console.log(`There is no specific case to determine the defense stat of ${move}`);
                break;
        }
    }
    return returnVal;
}

function getBasePower(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj) {
    let returnVal = typeof moveObj.basePower === 'undefined' ? baseMoveObj.basePower : moveObj.basePower;
    let maxResolve = battleObj[battleKey][attacker].chars[attackChar].maxResolve;
    let currentResolve = battleObj[battleKey][attacker].chars[attackChar].resolve;
    
    if (returnVal == "varies") {
        switch (move) {
            case 'Grit':
                let percentMissingResolve = (maxResolve - currentResolve) / maxResolve;
                returnVal = 2 * percentMissingResolve + 0.5;
                break;

            case 'Obliterate':
                let percentRemainingResolve = currentResolve / maxResolve;
                returnVal = 2 * percentRemainingResolve + 3;
                break;

            case 'Shatter':
                let numSecrets = 0;
                if (typeof battleObj[battleKey][attacker].chars[attackChar].secrets !== 'undefined') {
                    numSecrets = battleObj[battleKey][attacker].chars[attackChar].secrets.size;
                }

                if (numSecrets < 3) {
                    returnVal = 1;
                }
                else if (numSecrets == 3) {
                    returnVal = 2;
                }

                break;

            default:
                console.log(`There is no specific case to determine the base power of ${move}`);
                break;
        }
    }
    return returnVal;
}

function getPriority(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj) {
    let returnVal = typeof moveObj.priority === 'undefined' ? baseMoveObj.priority : moveObj.priority;

    if (returnVal == "varies") {
        switch (move) {
            case 'Shatter':
                let numSecrets = 0;
                if (typeof battleObj[battleKey][attacker].chars[attackChar].secrets !== 'undefined') {
                    numSecrets = battleObj[battleKey][attacker].chars[attackChar].secrets.size;
                }

                if (numSecrets == 0) {
                    returnVal = 0;
                }
                else if (numSecrets >= 1) {
                    returnVal = 3;
                }
                break;
        
            default:
                console.log(`There is no specific case to determine the priority of ${move}`);
                break;
        }
    }
    return returnVal;
}