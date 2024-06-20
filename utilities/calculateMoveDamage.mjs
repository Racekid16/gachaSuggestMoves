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
    //TODO: implement this properly
    if (Object.values(moveObj).some(value => value === 'varies')) {
        return [-1, false];
    }
    let baseMoveObj = getBaseMoveObj(moveObj);
    let completeMoveObj = structuredClone(moveObj);

    completeMoveObj.attackStat = getAttackStat(move, moveObj, baseMoveObj);
    completeMoveObj.defenseStat = getDefenseStat(move, moveObj, baseMoveObj);
    completeMoveObj.basePower = getBasePower(move, moveObj, baseMoveObj);
    completeMoveObj.priority = getPriority(move, moveObj, baseMoveObj);

    let attackerAttackStat = battleObj[battleKey][attacker].chars[attackChar][completeMoveObj.attackStat];
    let attackerInflictMultiplier = battleObj[battleKey][attacker].chars[attackChar].inflictMultiplier;

    let defenderDefenseStat = battleObj[battleKey][defender].chars[defenseChar][completeMoveObj.defenseStat];
    let defenderReceiveMultiplier = battleObj[battleKey][defender].chars[defenseChar].receiveMultiplier;
    let defenderPersonality = battleObj[battleKey][defender].chars[defenseChar].personality;

    let isCritical = false;
    if (consts.personalityWeaknesses[defenderPersonality].includes(moveObj.damageType)) {
        isCritical = true;
    }

    let damage;
    //this is a guess for how much damage will be dealt, since I don't know the exact damage formula
    if (defenderDefenseStat != 0) {
        if (!isCritical) {
            damage = round(36 * attackerAttackStat / defenderDefenseStat * completeMoveObj.basePower * attackerInflictMultiplier * defenderReceiveMultiplier);
        } else {
            damage = round(36 * attackerAttackStat / defenderDefenseStat * completeMoveObj.basePower * attackerInflictMultiplier * defenderReceiveMultiplier * 1.4);
        }
    } else {
        if (!isCritical) {
            damage = round(2 * attackerAttackStat * completeMoveObj.basePower);
        } else {
            damage = round(2 * attackerAttackStat * completeMoveObj.basePower * 1.4);
        }
    }

    return [damage, isCritical];
}

// get the base move obj from which this moveObj derives.
export function getBaseMoveObj(moveObj) {
    let damageType = moveObj.damageType;
    return consts.moveInfo[damageType];
}

function getAttackStat(move, moveObj, baseMoveObj) {
    let returnVal = typeof moveObj.attackStat === 'undefined' ? baseMoveObj.attackStat : moveObj.attackStat;
    if (returnVal == "varies") {
        switch (move) {
            case 'Impulse':
                break;
            
            default:
                console.log(`There is no specific case to determine the attack stat of ${move}`);
        }
    }
    return returnVal;
}

function getDefenseStat(move, moveObj, baseMoveObj) {
    let returnVal = typeof moveObj.defenseStat === 'undefined' ? baseMoveObj.defenseStat : moveObj.defenseStat;
    if (returnVal == "varies") {
        switch (move) {
            default:
                console.log(`There is no specific case to determine the defense stat of ${move}`);
        }
    }
    return returnVal;
}

function getBasePower(move, moveObj, baseMoveObj) {
    let returnVal = typeof moveObj.basePower === 'undefined' ? baseMoveObj.basePower : moveObj.basePower;
    if (returnVal == "varies") {
        switch (move) {
            default:
                console.log(`There is no specific case to determine the base power of ${move}`);
        }
    }
    return returnVal;
}

function getPriority(move, moveObj, baseMoveObj) {
    let returnVal = typeof moveObj.priority === 'undefined' ? baseMoveObj.priority : moveObj.priority;
    if (returnVal == "varies") {
        switch (move) {
            default:
                console.log(`There is no specific case to determine the priority of ${move}`);
        }
    }
    return returnVal;
}