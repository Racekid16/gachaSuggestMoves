import { calculateMoveDamage, getCompleteMoveObj } from './calculateMoveDamage.mjs';
import { emulateMove } from './emulateMove.mjs';
import { hasBoost, removeExpiredBoosts, applyBoosts} from './updateBoosts.mjs';
import { removeExpiredStatuses, applyStatuses} from './updateStatuses.mjs';
import { removeExpiredDamageModifiers, applyDamageModifiers } from './updateDamageModifiers.mjs';
import consts from '../consts.json' assert { type: 'json' };


export function findOptimalSequenceNoDefender(battleObj, battleKey, attacker, defender, attackChar, defenseChar) {
    let validMoves = battleObj[battleKey][attacker].chars[attackChar].moves
        .filter(move => !consts.moveInfo[move].type.includes("innate")
                     && (consts.moveInfo[move].type[0] == "attack" || consts.moveInfo[move].type[0] == "boost"));
    let validMovesObjs = validMoves.map(move => {
        let moveObj = getCompleteMoveObj(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move)
        return { ...moveObj, name: move };
    });
    let attackMoves = validMoves.filter(move => consts.moveInfo[move].type.includes("attack"));
    let numAttackMoves = attackMoves.length;
    if (numAttackMoves == 0) {
        console.log(`${attackChar} has no attack moves.`);
        return;
    }

    let loggingFunc = battleObj[battleKey].log;
    let boostMovesObjs = validMovesObjs.filter(moveObj => moveObj.type.includes("boost") && !moveObj.type.includes("attack"));
    let maxBoostTurns = boostMovesObjs.reduce((maxObj, currentObj) => currentObj.numTurns >= maxObj.numTurns ? currentObj : maxObj, { numTurns: 0}).numTurns;
    let results = [];

    function makeSequencesNoDefender(battleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, sequence, turn, boostTurns, maxBoostTurns) {
        for (let moveObj of validMovesObjs) {
            if (battleObj[battleKey][defender].chars[defenseChar].resolve <= 0) {
                results.push([...sequence]);
                return;
            }
            if (moveObj.type.includes("attack")) {
                let highestDamageMove = attackMoves.reduce((maxMove, currentMove) => {
                    let maxMoveDamage = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, maxMove)[1];
                    let currentMoveDamage = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, currentMove)[1];
                    return currentMoveDamage > maxMoveDamage ? currentMove : maxMove;
                });
                let highestDamage = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, highestDamageMove)[1];
                let moveDamage = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, moveObj.name)[1];
                if (moveDamage <= 0 || moveDamage < highestDamage) {
                    continue;
                }
                sequence.push([moveObj.name, moveDamage]);
                let tempBattleObj = structuredClone(battleObj);
                emulateTurn(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, moveObj.name);
                makeSequencesNoDefender(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, sequence, turn + 1, 0, maxBoostTurns);
                sequence.pop();
            } 
            else if (moveObj.type.includes("boost")) {
                if (boostTurns == maxBoostTurns) {
                    return;
                }
                let targetPlayer = moveObj.target == "attacker" ? attacker : defender;
                let targetChar = targetPlayer == attacker ? attackChar : defenseChar;
                if (hasBoost(battleObj, battleKey, targetPlayer, targetChar, moveObj.name) && moveObj.stacks === false) {
                    continue;
                }
                sequence.push(moveObj.name);
                let tempBattleObj = structuredClone(battleObj);
                emulateTurn(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, moveObj.name);
                makeSequencesNoDefender(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, sequence, turn + 1, boostTurns + 1, maxBoostTurns);
                sequence.pop();
            }
        }
    }

    delete battleObj[battleKey].log;
    let tempBattleObj = structuredClone(battleObj);
    makeSequencesNoDefender(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, [], 1, 0, maxBoostTurns);
    battleObj[battleKey].log = loggingFunc;
    //TODO: find best sequence from determined results
    console.log(results);
}

// for simulation purposes only. Does not consider innate abilities or character transformations
function emulateTurn(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, move) {
    emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, null, turn);
    let moveDamage = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move)[1];
    battleObj[battleKey][defender].chars[defenseChar].resolve -= moveDamage;
    removeExpiredBoosts(battleObj, battleKey, attacker, turn);
    removeExpiredBoosts(battleObj, battleKey, defender, turn);
    removeExpiredStatuses(battleObj, battleKey, attacker, turn);
    removeExpiredStatuses(battleObj, battleKey, defender, turn);
    removeExpiredDamageModifiers(battleObj, battleKey, attacker, turn);
    removeExpiredDamageModifiers(battleObj, battleKey, defender, turn);
    applyBoosts(battleObj, battleKey, attacker);
    applyBoosts(battleObj, battleKey, defender);
    applyStatuses(battleObj, battleKey, attacker);
    applyStatuses(battleObj, battleKey, defender);
    applyDamageModifiers(battleObj, battleKey, attacker);
    applyDamageModifiers(battleObj, battleKey, defender);
}