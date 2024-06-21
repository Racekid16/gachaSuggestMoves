import { round } from './round.mjs';
import consts from '../consts.json' assert { type: 'json' };

// calculate how much damage a move does. This assumes the move is a type that deals damage,
// and that it is a base type or derives from a base type.
export function calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move) {
    let moveObj = consts.moveInfo[move];
    if (typeof moveObj === 'undefined') {
        //console.log(`${move} is not in consts.json`);
        return [-1, false];
    }
    if (!moveObj.type.includes('attack')) {
        //console.log(`${move} is not an Attack type move.`);
        return [-1, false];
    }

    moveObj.damageType = getDamageType(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj);
    let baseMoveObj = getBaseMoveObj(moveObj);
    let completeMoveObj = structuredClone(moveObj);

    completeMoveObj.attackStat = getAttackStat(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj);
    completeMoveObj.defenseStat = getDefenseStat(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj);
    completeMoveObj.basePower = getBasePower(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj);
    completeMoveObj.priority = getPriority(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj, completeMoveObj);

    let attackerAttackStat = battleObj[battleKey][attacker].chars[attackChar][completeMoveObj.attackStat];
    let attackerAspectBoost = battleObj[battleKey][attacker].chars[attackChar].aspectBoost[completeMoveObj.attackStat];
    let attackerInflictMultiplier = battleObj[battleKey][attacker].chars[attackChar].inflictMultiplier;
    let attackPower = attackerAttackStat * attackerAspectBoost * attackerInflictMultiplier * completeMoveObj.basePower

    let defenderPersonality = battleObj[battleKey][defender].chars[defenseChar].personality;
    let defenderDefenseStat = battleObj[battleKey][defender].chars[defenseChar][completeMoveObj.defenseStat];
    let defenderAspectBoost = battleObj[battleKey][defender].chars[defenseChar].aspectBoost[completeMoveObj.defenseStat];
    let defenderReceiveMultiplier = battleObj[battleKey][defender].chars[defenseChar].receiveMultiplier;
    let defensePower = defenderDefenseStat * defenderAspectBoost * defenderReceiveMultiplier;
    
    let isCritical = false;
    if (consts.personalityWeaknesses[defenderPersonality].includes(moveObj.damageType)) {
        isCritical = true;
    }

    let damage;
    //this is a guess for how much damage will be dealt, since I don't know the exact damage formula
    if (defenderDefenseStat != 0) {
        if (!isCritical) {
            damage = round(36 * attackPower / defensePower);
        } else {
            damage = round(36 * attackPower / defensePower * 1.4);
        }
    } else {
        if (!isCritical) {
            damage = round(2 * attackPower);
        } else {
            damage = round(2 * attackPower * 1.4);
        }
    }

    return [completeMoveObj, damage, isCritical];
}

function getDamageType(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj) {
    let returnVal = moveObj.damageType;
    if (returnVal == "varies") {
        switch (move) {
            case 'Impulse':
                const attackStats = ['mental', 'physical', 'social'];
                let highestAttackStat =  attackStats.reduce((highest, current) => {
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
        }
    }
    return returnVal;
}

// get the base move obj from which this moveObj derives.
export function getBaseMoveObj(moveObj) {
    let damageType = moveObj.damageType;
    return consts.moveInfo[damageType];
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

            default:
                console.log(`There is no specific case to determine the defense stat of ${move}`);
        }
    }
    return returnVal;
}

function getBasePower(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, moveObj, baseMoveObj) {
    let returnVal = typeof moveObj.basePower === 'undefined' ? baseMoveObj.basePower : moveObj.basePower;
    if (returnVal == "varies") {
        switch (move) {
            case 'Grit':
                let baseResolve = battleObj[battleKey][attacker].baseCharStats[attackChar].resolve;
                let currentResolve = battleObj[battleKey][attacker].chars[attackChar].resolve;
                let percentMissingResolve = (baseResolve - currentResolve) / baseResolve;
                returnVal = 2 * percentMissingResolve + 0.5;
                break;
            
            case 'Shatter':
                let numSecrets = 0;
                if (typeof battleObj[battleKey][attacker].chars[attackChar].secrets !== 'undefined') {
                    numSecrets = battleObj[battleKey][attacker].chars[attackChar].secrets.size;
                }

                if (numSecrets == 0) {
                    returnVal = 0;
                }
                else if (numSecrets == 1 || numSecrets == 2) {
                    returnVal = 1;
                }
                else if (numSecrets == 3) {
                    returnVal = 2;
                }

                break;

            default:
                console.log(`There is no specific case to determine the base power of ${move}`);
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
        }
    }
    return returnVal;
}