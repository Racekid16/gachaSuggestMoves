import { calculateMoveDamage, calculateMoveHealing, getCompleteMoveObj } from './calculateMoveDamage.mjs';
import { emulateMove } from './emulateMove.mjs';
import { hasBoost, removeExpiredBoosts, applyBoosts} from './updateBoosts.mjs';
import { removeExpiredStatuses, applyStatuses, hasStatus } from './updateStatuses.mjs';
import { removeExpiredDamageModifiers, applyDamageModifiers } from './updateDamageModifiers.mjs';
import { removeExpiredFieldEffects } from './updateFieldEffects.mjs';
import consts from '../consts.json' assert { type: 'json' };

export function findOptimalSequence(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn) {
    let optimalSequenceNoDefender = findOptimalSequenceNoDefender(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn);
    return optimalSequenceNoDefender;
}

export function getMovesCharCanMake(battleObj, battleKey, playerName, charName) {
    let charMoves = structuredClone(battleObj[battleKey][playerName].chars[charName].moves);
    charMoves.push("Switch-in");

    let returnArr = [];
    for (let move of charMoves) {
        let moveObj = consts.moveInfo[move];
        if (typeof moveObj === 'undefined') {
            console.log(`${charName} has unrecognized move ${move}`);
            continue;
        }
        if (moveObj.type.includes("innate")) {
            continue;   
        }
        if (hasStatus(battleObj, battleKey, playerName, charName, "stunned") || hasStatus(battleObj, battleKey, playerName, charName, "resting")) {
            continue;
        }
        if (moveObj.type.includes("attack") && hasStatus(battleObj, battleKey, playerName, charName, "pacified")) {
            continue;   
        }
        if (moveObj.type.includes("attack") && hasStatus(battleObj, battleKey, playerName, charName, "taunted")) {
            continue;
        }
        if (moveObj.type.includes("switch-in") && (hasStatus(battleObj, battleKey, playerName, charName, "trapped")  || hasStatus(battleObj, battleKey, playerName, charName, "taunted"))) {
            continue;
        }
        if (battleObj[battleKey][playerName].chars[charName].lockedMoves.some(obj => obj.name == move)) {
            continue;
        }
        returnArr.push(move);
    }
    return returnArr;
}

function findOptimalSequenceNoDefender(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn) {
    let validMoves = getMovesCharCanMake(battleObj, battleKey, attacker, attackChar)
        .filter(move => consts.moveInfo[move].type[0] == "attack" || consts.moveInfo[move].type[0] == "boost")
    let validMovesObjs = validMoves.map(move => {
        let moveObj = getCompleteMoveObj(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move);
        return { ...moveObj, name: move };
    });
    let attackMoves = validMoves.filter(move => consts.moveInfo[move].type.includes("attack"));
    let damagingMoves = validMoves.map(move => calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move)[1]).filter(damage => damage != 0);
    if (damagingMoves.length == 0) {
        return validMoves;
    } 

    let boostMovesObjs = validMovesObjs.filter(moveObj => moveObj.type.includes("boost") && !moveObj.type.includes("attack"));
    let maxBoostTurns = boostMovesObjs.reduce((maxObj, currentObj) => currentObj.numTurns != Infinity && currentObj.numTurns >= maxObj.numTurns ? currentObj : maxObj, { numTurns: 1}).numTurns;
    let results = [];

    function makeSequencesNoDefender(battleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, sequence, turn, boostTurns, maxBoostTurns) {
        for (let moveObj of validMovesObjs) {
            let tempbattleObj = structuredClone(battleObj);
            if (tempbattleObj[battleKey][defender].chars[defenseChar].resolve <= 0) {
                results.push([...sequence, battleObj[battleKey][defender].chars[defenseChar].resolve]);
                return;
            }
            if (moveObj.type.includes("attack")) {
                let highestDamageMove = attackMoves.reduce((maxMove, currentMove) => {
                    let maxMoveDamage = calculateMoveDamage(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, maxMove)[1];
                    let currentMoveDamage = calculateMoveDamage(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, currentMove)[1];
                    return currentMoveDamage > maxMoveDamage && !consts.moveInfo[currentMove].hasNegativeImpact ? currentMove : maxMove;
                });
                let highestDamage = calculateMoveDamage(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, highestDamageMove)[1];
                let moveDamage = calculateMoveDamage(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, moveObj.name)[1];
                //only allow highest damaging move
                if (moveDamage <= 0 || moveDamage < highestDamage) {
                    continue;
                }
                sequence.push(moveObj.name);
                emulateTurnAction(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, moveObj.name);
                emulateTurnEnd(tempbattleObj, battleKey, attacker, defender, turn);
                makeSequencesNoDefender(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, sequence, turn + 1, 0, maxBoostTurns);
                sequence.pop();
            } 
            else if (moveObj.type.includes("boost")) {
                if (boostTurns == maxBoostTurns) {
                    return;
                }
                let targetPlayer = moveObj.target == "attacker" ? attacker : defender;
                let targetChar = targetPlayer == attacker ? attackChar : defenseChar;
                if (hasBoost(tempbattleObj, battleKey, targetPlayer, targetChar, moveObj.name) && moveObj.stacks === false) {
                    continue;
                }
                sequence.push(moveObj.name);
                emulateTurnAction(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, moveObj.name);
                emulateTurnEnd(tempbattleObj, battleKey, attacker, defender, turn);
                makeSequencesNoDefender(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, sequence, turn + 1, boostTurns + 1, maxBoostTurns);
                sequence.pop();
            }
        }
    }

    let tempbattleObj = {};
    let loggingFunc = battleObj[battleKey].log;
    delete battleObj[battleKey].log;
    let battleClone = structuredClone(battleObj[battleKey]);
    tempbattleObj[battleKey] = battleClone;
    battleObj[battleKey].log = loggingFunc;
    makeSequencesNoDefender(tempbattleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, [], turn, 0, maxBoostTurns);
    //only allow shortest sequences
    let shortestResultLength = results.reduce((shortest, current) => current.length < shortest.length ? current : shortest).length;
    let bestSequences = results.filter((sequence) => sequence.length == shortestResultLength);
    //only allow minimum negative impact
    let minNegativeImpact = bestSequences.reduce((minSoFar, currentSequence) => {
        let numNegativeImpact = currentSequence.reduce((numSoFar, move) => consts.moveInfo[move]?.hasNegativeImpact ? ++numSoFar : numSoFar, 0);
        return numNegativeImpact < minSoFar ? numNegativeImpact : minSoFar;
    }, Infinity);
    bestSequences = bestSequences.filter((sequence) => {
        let numNegativeImpact = sequence.reduce((numSoFar, move) => consts.moveInfo[move]?.hasNegativeImpact ? ++numSoFar : numSoFar, 0);
        return numNegativeImpact == minNegativeImpact;
    });
    //only allow most damage
    let lowestEndResolve = bestSequences.reduce((minSoFar, currentSequence) => {
        let endResolve = currentSequence[currentSequence.length - 1];
        return endResolve < minSoFar ? endResolve : minSoFar;
    }, Infinity);
    bestSequences = bestSequences.filter((sequence) => sequence[sequence.length - 1] == lowestEndResolve);
    //only allow most boosts
    let mostBoosts = bestSequences.reduce((mostSoFar, currentSequence) => {
        let numBoosts = currentSequence.reduce((numSoFar, move) => consts.moveInfo[move]?.type.includes("boost") ? ++numSoFar : numSoFar, 0);
        return numBoosts > mostSoFar ? numBoosts : mostSoFar;
    }, -Infinity);
    bestSequences = bestSequences.filter((sequence) => {
        let numBoosts = sequence.reduce((numSoFar, move) => consts.moveInfo[move]?.type.includes("boost") ? ++numSoFar : numSoFar, 0);
        return numBoosts == mostBoosts;
    });
    //only allow earliest boosts
    let minBoostIndices = bestSequences.reduce((minSumSoFar, currentSequence) => {
        let sumIndices = currentSequence.reduce((sum, move, index) => {
            return consts.moveInfo[move]?.type.includes("boost") ? sum + index : sum;
        }, 0);
        return sumIndices < minSumSoFar ? sumIndices : minSumSoFar;
    }, Infinity);
    bestSequences = bestSequences.filter((sequence) => {
        let sumIndices = sequence.reduce((sum, move, index) => {
            return consts.moveInfo[move]?.type.includes("boost") ? sum + index : sum;
        }, 0);
        return sumIndices == minBoostIndices;
    });
    //remove the last element from the sequence arrays as that is the final resolve of the attacker
    bestSequences.forEach((sequence) => sequence.pop());
    //if there are multiple best sequences, just return the first one
    return bestSequences[0];
}

//return who would kill the other first
function simulateSequences(battleObj, p1name, p2name, p1char, p2char, turn, p1sequence, p2sequence) {
    let tempP1sequence = structuredClone(p1sequence);
    let tempP2sequence = structuredClone(p2sequence);
    let battleKey = p1name + " vs. " + p2name;
    console.log(p1name, tempP1sequence);
    console.log(p2name, tempP2sequence);

    let tempbattleObj = {};
    let loggingFunc = battleObj[battleKey].log;
    delete battleObj[battleKey].log;
    let battleClone = structuredClone(battleObj[battleKey]);
    tempbattleObj[battleKey] = battleClone;
    battleObj[battleKey].log = loggingFunc;

    while (tempP1sequence.length != 0 && tempP2sequence.length != 0) {
        let p1move = tempP1sequence.shift();
        let p2move = tempP2sequence.shift();
        emulateTurnMoves(tempbattleObj, battleKey, p1name, p2name, p1char, p2char, turn, p1move, p2move);
        emulateTurnEnd(tempbattleObj, battleKey, p1name, p2name, turn);
    }
    if (tempP1sequence.length > tempP2sequence.length) {
        console.log(p2name, "would win and have", tempbattleObj[battleKey][p2name].chars[p2char].resolve, "resolve remaining.");
        return [p2name, p1name];
    }
    console.log(p1name, "would win and have", tempbattleObj[battleKey][p1name].chars[p1char].resolve, "resolve remaining.");
    return [p1name, p2name];
}

function emulateTurnMoves(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, attackerMove, defenderMove) {
    if (battleObj[battleKey][attacker].chars[attackChar].initiative < battleObj[battleKey][defender].chars[defenseChar].initiative) {
        emulateTurnAction(battleObj, battleKey, defender, attacker, defenseChar, attackChar, turn, defenderMove);
        
        if (battleObj[battleKey][attacker].chars[attackChar].resolve > 0) {
            emulateTurnAction(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, attackerMove);
        }
    }
    else {
        emulateTurnAction(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, attackerMove);
        
        if (battleObj[battleKey][defender].chars[defenseChar].resolve > 0) {
            emulateTurnAction(battleObj, battleKey, defender, attacker, defenseChar, attackChar, turn, defenderMove);
        }
    }
}

// for simulation purposes only. Does not consider innate abilities or character transformations
function emulateTurnAction(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, move) {
    switch (move) {
        case 'Kabedon':
            break;
        case 'Kings Command':
            break;
        case 'Introversion':
            break;
        default:
            emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, null, turn);
            break;
    }
    let moveDamage = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move)[1];
    battleObj[battleKey][defender].chars[defenseChar].resolve -= moveDamage;
    let moveHealObj = calculateMoveHealing(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move)[1];
    for (let charKey in moveHealObj) {
        battleObj[battleKey][attacker].chars[charKey].resolve += moveHealObj[charKey];
    }
}

function emulateTurnEnd(battleObj, battleKey, attacker, defender, turn) {
    removeExpiredBoosts(battleObj, battleKey, attacker, turn);
    removeExpiredBoosts(battleObj, battleKey, defender, turn);
    removeExpiredStatuses(battleObj, battleKey, attacker, turn);
    removeExpiredStatuses(battleObj, battleKey, defender, turn);
    removeExpiredDamageModifiers(battleObj, battleKey, attacker, turn);
    removeExpiredDamageModifiers(battleObj, battleKey, defender, turn);
    removeExpiredFieldEffects(battleObj, battleKey, turn);
    applyBoosts(battleObj, battleKey, attacker);
    applyBoosts(battleObj, battleKey, defender);
    applyStatuses(battleObj, battleKey, attacker);
    applyStatuses(battleObj, battleKey, defender);
    applyDamageModifiers(battleObj, battleKey, attacker);
    applyDamageModifiers(battleObj, battleKey, defender);
}
