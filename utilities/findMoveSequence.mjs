import { calculateMoveDamage, calculateMoveHealing, getCompleteMoveObj } from './calculateMoveDamage.mjs';
import { emulateMove } from './emulateMove.mjs';
import { hasBoost, removeExpiredBoosts, applyBoosts} from './updateBoosts.mjs';
import { removeExpiredStatuses, applyStatuses} from './updateStatuses.mjs';
import { removeExpiredDamageModifiers, applyDamageModifiers } from './updateDamageModifiers.mjs';
import consts from '../consts.json' assert { type: 'json' };

const excludedMoves = ["Kings Command"]
//TODO: remove
let myBattleObj = JSON.parse(`{"1.Tommy3 vs. 2.Chairman Sakayanagi":{"time":"6/25/2024, 10:58:32 AM","numPartiesRequested":2,"requestedParties":["1101145170466062416","277933921315061761"],"2.Chairman Sakayanagi":{"chars":{"Shiro":{"name":"Shiro","rarity":"Special","numStars":5,"personality":"Cold","moves":["Academic","Athleticism","Fighting","Empathy"],"resolve":183,"mental":165,"physical":220,"social":128,"initiative":116,"supportCategory":"Physical","supportBonus":42,"allies":["White Room"],"tags":["Boy","White Room","Fighter"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}},"Yagami Takuya":{"name":"Yagami Takuya","rarity":"Shining","numStars":5,"personality":"Cold","moves":["Scheming","Fighting","Influence","Hate"],"resolve":167,"mental":163,"physical":205,"social":147,"initiative":100,"supportCategory":"Social","supportBonus":24,"allies":["Kōhai","White Room"],"tags":["Kōhai","Boy","White Room","Fighter","Scholar","Student Council","Persona"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}},"Amasawa Ichika":{"name":"Amasawa Ichika","rarity":"Shining","numStars":5,"personality":"Cunning","moves":["Academic","Scheming","Fighting","Grit"],"resolve":175,"mental":166,"physical":216,"social":90,"initiative":105,"supportCategory":"Physical","supportBonus":36,"allies":["White Room"],"tags":["Kōhai","Girl","White Room","Fighter","Scholar"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}}},"id":"1101145170466062416","previousTaggedInChar":null,"baseCharStats":{"Shiro":{"name":"Shiro","rarity":"Special","numStars":5,"personality":"Cold","moves":["Academic","Athleticism","Fighting","Empathy"],"resolve":183,"mental":165,"physical":220,"social":128,"initiative":116,"supportCategory":"Physical","supportBonus":42,"allies":["White Room"],"tags":["Boy","White Room","Fighter"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}},"Yagami Takuya":{"name":"Yagami Takuya","rarity":"Shining","numStars":5,"personality":"Cold","moves":["Scheming","Fighting","Influence","Hate"],"resolve":167,"mental":163,"physical":205,"social":147,"initiative":100,"supportCategory":"Social","supportBonus":24,"allies":["Kōhai","White Room"],"tags":["Kōhai","Boy","White Room","Fighter","Scholar","Student Council","Persona"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}},"Amasawa Ichika":{"name":"Amasawa Ichika","rarity":"Shining","numStars":5,"personality":"Cunning","moves":["Academic","Scheming","Fighting","Grit"],"resolve":175,"mental":166,"physical":216,"social":90,"initiative":105,"supportCategory":"Physical","supportBonus":36,"allies":["White Room"],"tags":["Kōhai","Girl","White Room","Fighter","Scholar"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}}},"valid":true},"1.Tommy3":{"chars":{"Ichinose Honami":{"name":"Ichinose Honami","rarity":"Shining","numStars":3,"personality":"Benevolent","moves":["Academic","Influence","Empathy","Unity"],"resolve":127,"mental":88,"physical":62,"social":131,"initiative":92,"supportCategory":"Social","supportBonus":26,"allies":["Class B"],"tags":["Class B","Girl","Student Council","Scholar"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}},"Ayanokōji Kiyotaka":{"name":"Ayanokōji Kiyotaka","rarity":"Shining","numStars":4,"personality":"Apathetic","moves":["Scheming","Fighting","Empathy","Kings Command"],"resolve":158,"mental":156,"physical":122,"social":118,"initiative":50,"supportCategory":"Mental","supportBonus":36,"allies":["Class D","Politician"],"tags":["Class D","Boy","White Room","Fighter","Scholar","Persona"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}},"Karuizawa Kei":{"name":"Karuizawa Kei","rarity":"Glowing","numStars":3,"personality":"Bold","moves":["Scheming","Influence","Hate"],"resolve":137,"mental":86,"physical":48,"social":85,"initiative":88,"supportCategory":"Resolve","supportBonus":10,"allies":["Girl"],"tags":["Class D","Girl","Persona"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}}},"previousTaggedInChar":null,"id":"277933921315061761","baseCharStats":{"Ichinose Honami":{"name":"Ichinose Honami","rarity":"Shining","numStars":3,"personality":"Benevolent","moves":["Academic","Influence","Empathy","Unity"],"resolve":127,"mental":88,"physical":62,"social":131,"initiative":92,"supportCategory":"Social","supportBonus":26,"allies":["Class B"],"tags":["Class B","Girl","Student Council","Scholar"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}},"Ayanokōji Kiyotaka":{"name":"Ayanokōji Kiyotaka","rarity":"Shining","numStars":4,"personality":"Apathetic","moves":["Scheming","Fighting","Empathy","Kings Command"],"resolve":158,"mental":156,"physical":122,"social":118,"initiative":50,"supportCategory":"Mental","supportBonus":36,"allies":["Class D","Politician"],"tags":["Class D","Boy","White Room","Fighter","Scholar","Persona"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}},"Karuizawa Kei":{"name":"Karuizawa Kei","rarity":"Glowing","numStars":3,"personality":"Bold","moves":["Scheming","Influence","Hate"],"resolve":137,"mental":86,"physical":48,"social":85,"initiative":88,"supportCategory":"Resolve","supportBonus":10,"allies":["Girl"],"tags":["Class D","Girl","Persona"],"buffs":[],"debuffs":[],"positiveStatuses":[],"negativeStatuses":[],"inflictMultiplier":1,"receiveMultiplier":1,"inflictModifiers":[],"receiveModifiers":[],"aspectBoost":{"initiative":1,"mental":1,"physical":1,"social":1}}},"valid":true}}}`);

// return: [p1optimalSequence, p2optimalSequence]
export function findOptimalSequence(battleObj, p1name, p2name, p1char, p2char, turn) {
    let battleKey = p1name + " vs. " + p2name;
    let p1optimalNoDefender = findOptimalSequenceNoDefender(battleObj, battleKey, p1name, p2name, p1char, p2char, turn);
    let p2optimalNoDefender = findOptimalSequenceNoDefender(battleObj, battleKey, p2name, p1name, p2char, p1char, turn);
    let winner = simulateSequences(battleObj, p1name, p2name, p1char, p2char, turn, p1optimalNoDefender, p2optimalNoDefender);
    
}

function findOptimalSequenceNoDefender(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn) {
    let validMoves = battleObj[battleKey][attacker].chars[attackChar].moves
        .filter(move => !consts.moveInfo[move].type.includes("innate") && !excludedMoves.includes(move)
                     && (consts.moveInfo[move].type[0] == "attack" || consts.moveInfo[move].type[0] == "boost"));
    let validMovesObjs = validMoves.map(move => {
        let moveObj = getCompleteMoveObj(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move)
        return { ...moveObj, name: move };
    });
    let attackMoves = validMoves.filter(move => consts.moveInfo[move].type.includes("attack"));
    let numAttackMoves = attackMoves.length;
    if (numAttackMoves == 0) {
        console.log(`${attackChar} has no attack moves.`);
        return validMoves[0];
    }

    let boostMovesObjs = validMovesObjs.filter(moveObj => moveObj.type.includes("boost") && !moveObj.type.includes("attack"));
    let maxBoostTurns = boostMovesObjs.reduce((maxObj, currentObj) => currentObj.numTurns >= maxObj.numTurns ? currentObj : maxObj, { numTurns: 0}).numTurns;
    let results = [];

    try {
        function makeSequencesNoDefender(battleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, sequence, turn, boostTurns, maxBoostTurns) {
            for (let moveObj of validMovesObjs) {
                if (battleObj[battleKey][defender].chars[defenseChar].resolve <= 0) {
                    results.push([...sequence, battleObj[battleKey][defender].chars[defenseChar].resolve]);
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
                    //only allow highest damaging move
                    if (moveDamage <= 0 || moveDamage < highestDamage) {
                        continue;
                    }
                    sequence.push(moveObj.name);
                    let tempBattleObj = structuredClone(battleObj);
                    emulateTurnAction(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, moveObj.name);
                    emulateTurnEnd(tempBattleObj, battleKey, attacker, defender, turn);
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
                    emulateTurnAction(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, moveObj.name);
                    emulateTurnEnd(tempBattleObj, battleKey, attacker, defender, turn);
                    makeSequencesNoDefender(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, sequence, turn + 1, boostTurns + 1, maxBoostTurns);
                    sequence.pop();
                }
            }
        }

        let tempBattleObj = {};
        let loggingFunc = battleObj[battleKey].log;
        delete battleObj[battleKey].log;
        let battleClone = structuredClone(battleObj[battleKey]);
        tempBattleObj[battleKey] = battleClone;
        battleObj[battleKey].log = loggingFunc;
        //TODO: remove
        console.log(JSON.stringify(tempBattleObj));
        makeSequencesNoDefender(tempBattleObj, battleKey, attacker, defender, attackChar, defenseChar, validMovesObjs, [], turn, 0, maxBoostTurns);
        //only allow shortest sequences
        let shortestResultLength = results.reduce((shortest, current) => current.length < shortest.length ? current : shortest).length;
        let bestSequences = results.filter((sequence) => sequence.length == shortestResultLength);
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
        return bestSequences[0];
    } catch (err) {
        console.log(battleObj);
        console.log("attacker is", attacker, "and valid moves are", validMoves);
        console.log("defender is", defender);
        throw err;
    }
}

//return who would kill the other first
function simulateSequences(battleObj, p1name, p2name, p1char, p2char, turn, p1sequence, p2sequence) {
    let battleKey = p1name + " vs. " + p2name;
    console.log(p1name, p1sequence);
    console.log(p2name, p2sequence);

    let tempBattleObj = {};
    let loggingFunc = battleObj[battleKey].log;
    delete battleObj[battleKey].log;
    let battleClone = structuredClone(battleObj[battleKey]);
    tempBattleObj[battleKey] = battleClone;
    battleObj[battleKey].log = loggingFunc;

    while (p1sequence.length != 0 && p2sequence.length != 0) {
        if (tempBattleObj[battleKey][p1name].chars[p1char].initiative < tempBattleObj[battleKey][p2name].chars[p2char].initiative) {
            let p2move = p2sequence.shift();
            emulateTurnAction(battleObj, battleKey, p2name, p1name, p2char, p1char, turn, p2move);
            
            if (battleObj[battleKey][p1name].chars[p1char].resolve > 0) {
                let p1move = p1sequence.shift();
                emulateTurnAction(battleObj, battleKey, p1name, p2name, p1char, p2char, turn, p1move);
            }
        }
        else {
            let p1move = p1sequence.shift();
            emulateTurnAction(battleObj, battleKey, p1name, p2name, p1char, p2char, turn, p1move);
            if (battleObj[battleKey][p2name].chars[p2char].resolve > 0) {
                let p2move = p2sequence.shift();
                emulateTurnAction(battleObj, battleKey, p2name, p1name, p2char, p1char, turn, p2move);
            }
        }
        emulateTurnEnd(battleObj, battleKey, p1name, p2name, turn);
    }
    if (p1sequence.length > p2sequence.length) {
        console.log(p2name, battleObj[battleKey][p2name].chars[p2char].resolve);
        return p1name;
    }
    console.log(p1name, battleObj[battleKey][p1name].chars[p1char].resolve);
    return p2name;
}

// for simulation purposes only. Does not consider innate abilities or character transformations
function emulateTurnAction(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turn, move) {
    emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, null, turn);
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
    applyBoosts(battleObj, battleKey, attacker);
    applyBoosts(battleObj, battleKey, defender);
    applyStatuses(battleObj, battleKey, attacker);
    applyStatuses(battleObj, battleKey, defender);
    applyDamageModifiers(battleObj, battleKey, attacker);
    applyDamageModifiers(battleObj, battleKey, defender);
}

findOptimalSequence(myBattleObj, "1.Tommy3", "2.Chairman Sakayanagi", "Karuizawa Kei", "Shiro", 1);