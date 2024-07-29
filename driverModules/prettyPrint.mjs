// pretty-print people's parties and suggested moves.
import { round } from './round.mjs';
import { calculateMoveDamage } from './calculateMoveDamage.mjs';
import { getMovesCharCanMake } from './findMoveSequence.mjs';
import { hasFieldEffect } from './updateFieldEffects.mjs';

// print the stats of a party at the beginning of a battle
export function printParty(battleObj, battleKey, playerName, partyArray, hasStrength) {
    let charStats = battleObj[battleKey][playerName].chars;

    let printStrength = hasStrength ? '(Strength 3: +10% to stats)' : '';
    battleObj[battleKey].log(`${playerName}'s party ${printStrength}\nActive:`);    

    let activeChars = [];
    for (let i = 0; i < 3; i++) {
        if (partyArray[i].name != "empty") {
            activeChars.push(charStats[partyArray[i].name]);
        }
    }

    let activeNameLength = getMaxLength(activeChars, 'name');
    let initiativeLength = getMaxLength(activeChars, 'initiative');
    let mentalLength = getMaxLength(activeChars, 'mental');
    let physicalLength = getMaxLength(activeChars, 'physical');
    let socialLength = getMaxLength(activeChars, 'social');

    for (let char of activeChars) {
        battleObj[battleKey].log(`${char.numStars}⭐ ${char.name}${" ".repeat(activeNameLength - char.name.length)} `
                  + `🏃‍${char.initiative}${" ".repeat(initiativeLength - char.initiative.toString().length)} `
                  + `🧠${char.mental}${" ".repeat(mentalLength - char.mental.toString().length)} `
                  + `💪${char.physical}${" ".repeat(physicalLength - char.physical.toString().length)} `
                  + `🗣️${char.social}${" ".repeat(socialLength - char.social.toString().length)} `
                  + `❤️${char.resolve}`);
    }

    battleObj[battleKey].log("Bench:")

    let benchChars = [];
    for (let i = 3; i < 6; i++) {
        if (partyArray[i].name != "empty") {
            benchChars.push(charStats[partyArray[i].name]);
        }
    }

    let benchNameLength = getMaxLength(benchChars, 'name');
    let benchHasAbilityBoost = benchChars.reduce((hasAbility, char) => {
        return hasAbility || char.supportCategory == 'Ability';
    }, false);
    let supportCategoryLength = benchHasAbilityBoost ? 8 : 1;
    let supportBonusLength = getMaxLength(benchChars, 'supportBonus');
    
    for (let char of benchChars) {
        let supportCategorySymbol;
        switch (char.supportCategory) {
            case 'Initiative': supportCategorySymbol = "🏃"; break;
            case 'Mental': supportCategorySymbol = "🧠"; break;
            case 'Physical': supportCategorySymbol = "💪"; break;
            case 'Social': supportCategorySymbol = "🗣️"; break;
            case 'Resolve': supportCategorySymbol = "❤️"; break;
            case 'Ability': supportCategorySymbol = "🏃🧠💪🗣️"; break;
            case 'Strength': supportCategorySymbol = "🧠💪🗣️"; break;
            default: console.log(`Unrecognized support category ${char.supportCategory}`); break;
        }

        let alliedActiveChars = []
        for (let activeChar of activeChars) {
            alliedActiveChars.push(" ".repeat(activeChar.name.length));
        };
        for (let i = 0; i < activeChars.length; i++) {
            for (let ally of char.allies) {
                if (activeChars[i].tags.includes(ally)) {
                    alliedActiveChars[i] = activeChars[i].name;
                }
            }
        }
        
        battleObj[battleKey].log(`${char.numStars}⭐ ${char.name}${" ".repeat(benchNameLength - char.name.length)} `
                  + `${" ".repeat(char.supportCategory == 'Ability' ? 0 : supportCategoryLength - 1)}`
                  + `${supportCategorySymbol}`
                  + `${" ".repeat(supportBonusLength - char.supportBonus.toString().length)}`
                  + `+${char.supportBonus}% `
                  + `| ${alliedActiveChars[0]} | ${alliedActiveChars[1]} | ${alliedActiveChars[2]} |`);
    }

    battleObj[battleKey].log("");
}

// print the move that the program determines is good to play
export function printSuggestedMoves(battleObj, programSocket, p1name, p2name, p1char, p2char, p1moveSequence, p2moveSequence,
                                    p1move, p2move, p1moveObj, p2moveObj, p1damage, p2damage, p1hitType, p2hitType, turn) {
    let battleKey = p1name + " vs. " + p2name;
    
    let p1inflictMultiplier = battleObj[battleKey][p1name].chars[p1char].inflictMultiplier - 1;
    let p1printInflict = p1inflictMultiplier != 0 ? `💥+${Math.round(p1inflictMultiplier * 100)}% ` : '';
    let p2inflictMultiplier = battleObj[battleKey][p2name].chars[p2char].inflictMultiplier - 1;
    let p2printInflict = p2inflictMultiplier != 0 ? `💥+${Math.round(p2inflictMultiplier * 100)}% ` : '';
    let inflictLength = p1printInflict.length > p2printInflict.length ?
                        p1printInflict.length : p2printInflict.length;
    let p1receiveMultiplier = battleObj[battleKey][p1name].chars[p1char].receiveMultiplier - 1;
    let p1printReceive = p1receiveMultiplier != 0 ? `🛡️${p1receiveMultiplier * 100}% ` : '';
    let p2receiveMultiplier = battleObj[battleKey][p2name].chars[p2char].receiveMultiplier - 1;
    let p2printReceive = p2receiveMultiplier != 0 ? `🛡️${p2receiveMultiplier * 100}% ` : '';
    let receiveLength = p1printReceive.length > p2printReceive.length ?
                        p1printReceive.length : p2printReceive.length;
    let playerNameLength = p1name.length > p2name.length ? p1name.length : p2name.length;
    let charNameLength = p1char.length > p2char.length ? p1char.length : p2char.length;
    let p1initiative = battleObj[battleKey][p1name].chars[p1char].initiative;
    let p2initiative = battleObj[battleKey][p2name].chars[p2char].initiative;
    let initiativeLength = p1initiative.toString().length > p2initiative.toString().length ?
                           p1initiative.toString().length : p2initiative.toString().length;
    let p1mental = battleObj[battleKey][p1name].chars[p1char].mental;
    let p2mental = battleObj[battleKey][p2name].chars[p2char].mental;
    let mentalLength = p1mental.toString().length > p2mental.toString().length ? 
                       p1mental.toString().length : p2mental.toString().length;
    let p1physical = battleObj[battleKey][p1name].chars[p1char].physical;
    let p2physical = battleObj[battleKey][p2name].chars[p2char].physical;
    let physicalLength = p1physical.toString().length > p2physical.toString().length ? 
                         p1physical.toString().length : p2physical.toString().length;
    let p1social = battleObj[battleKey][p1name].chars[p1char].social;
    let p2social = battleObj[battleKey][p2name].chars[p2char].social;
    let socialLength = p1social.toString().length > p2social.toString().length ? 
                       p1social.toString().length : p2social.toString().length;
    let p1resolve = battleObj[battleKey][p1name].chars[p1char].resolve;
    let p2resolve = battleObj[battleKey][p2name].chars[p2char].resolve;
    let resolveLength = p1resolve.toString().length > p2resolve.toString().length ? 
                        p1resolve.toString().length : p2resolve.toString().length;
    let moveNameLength = p1move.length > p2move.length ? p1move.length: p2move.length;
    let maxVariance = 0.2;
    let p1lowerBound = Math.max(round(p1damage * (1 - maxVariance)), 0).toString();
    let p1upperBound = round(p1damage * (1 + maxVariance)).toString();
    let p2lowerBound = Math.max(round(p2damage * (1 - maxVariance)), 0).toString();
    let p2upperBound = round(p2damage * (1 + maxVariance)).toString();
    let lowerBoundLength = p1lowerBound.length > p2lowerBound.length ? p1lowerBound.length : p2lowerBound.length;
    let upperBoundLength = p1upperBound.length > p2upperBound.length ? p1upperBound.length : p2upperBound.length;
    let hitTypeLength = p1hitType.length > p2hitType.length ? p1hitType.length : p2hitType.length;

    let p1isFatal = p1lowerBound >= p2resolve;
    let p2isFatal = p2lowerBound >= p1resolve;

    let p1output =  `${p1name} ${" ".repeat(playerNameLength - p1name.length)}` 
                  + `[${p1printInflict}${" ".repeat(inflictLength - p1printInflict.length)}`
                  + `${p1printReceive}${" ".repeat(receiveLength - p1printReceive.length)}`
                  + `${p1char}${" ".repeat(charNameLength - p1char.length)} `
                  + `🏃${p1initiative}${" ".repeat(initiativeLength - p1initiative.toString().length)} `
                  + `🧠${p1mental}${" ".repeat(mentalLength - p1mental.toString().length)} `
                  + `💪${p1physical}${" ".repeat(physicalLength - p1physical.toString().length)} `
                  + `🗣️${p1social}${" ".repeat(socialLength - p1social.toString().length)} `
                  + `❤️${p1resolve}${" ".repeat(resolveLength - p1resolve.toString().length)}]: `
                  + `${p1move} ${" ".repeat(moveNameLength - p1move.length)}`;
    if (p1damage != 0) {
        p1output += `(${p1lowerBound} ${" ".repeat(lowerBoundLength - p1lowerBound.toString().length)}- `
                  + `${p1upperBound}${" ".repeat(upperBoundLength - p1upperBound.toString().length)}) `
                  + `${p1hitType}${" ".repeat(hitTypeLength - p1hitType.length)} `
                  + `${p1isFatal ? "FATAL" : ""}`;
    }
    let [p1str, p1buffs, p1debuffs, p1positiveStatuses, p1negativeStatuses, p1moves] = printCharacterOtherInformation(battleObj, battleKey, p1name, p2name, p1char, p2char, p1moveSequence, turn);
    p1output += p1str;
    
    let p2output =  `${p2name} ${" ".repeat(playerNameLength - p2name.length)}`
                  + `[${p2printInflict}${" ".repeat(inflictLength - p2printInflict.length)}`
                  + `${p2printReceive}${" ".repeat(receiveLength - p2printReceive.length)}`
                  + `${p2char}${" ".repeat(charNameLength - p2char.length)} `
                  + `🏃‍${p2initiative}${" ".repeat(initiativeLength - p2initiative.toString().length)} `
                  + `🧠${p2mental}${" ".repeat(mentalLength - p2mental.toString().length)} `
                  + `💪${p2physical}${" ".repeat(physicalLength - p2physical.toString().length)} `
                  + `🗣️${p2social}${" ".repeat(socialLength - p2social.toString().length)} `
                  + `❤️${p2resolve}${" ".repeat(resolveLength - p2resolve.toString().length)}]: `
                  + `${p2move} ${" ".repeat(moveNameLength - p2move.length)}`
    if (p2damage != 0) {
        p2output += `(${p2lowerBound} ${" ".repeat(lowerBoundLength - p2lowerBound.toString().length)}- `
                  + `${p2upperBound}${" ".repeat(upperBoundLength - p2upperBound.toString().length)}) `
                  + `${p2hitType}${" ".repeat(hitTypeLength - p2hitType.length)} `
                  + `${p2isFatal ? "FATAL" : ""}`;
    }
    let [p2str, p2buffs, p2debuffs, p2positiveStatuses, p2negativeStatuses, p2moves] = printCharacterOtherInformation(battleObj, battleKey, p2name, p1name, p2char, p1char, p2moveSequence, turn);
    p2output += p2str;

    let p1priority = p1moveObj.priority;
    let p2priority = p2moveObj.priority;

    let suggestedMovesOutput = "";
    
    let playerNumberToPrintFirst = 0;
    if (p1priority > p2priority) {
        playerNumberToPrintFirst = 1;
    }
    else if (p2priority > p1priority) {
        playerNumberToPrintFirst = 2;
    }
    else {
        if (p1initiative >= p2initiative) {
        playerNumberToPrintFirst = 1;
        } 
        else {    //p1initiative < p2initiative
            playerNumberToPrintFirst = 2;
        }

        if (hasFieldEffect(battleObj, battleKey, "Frozen World")) {
            playerNumberToPrintFirst = playerNumberToPrintFirst == 1 ? 2 : 1;
        }
    }

    if (playerNumberToPrintFirst == 1) {
        suggestedMovesOutput = p1output + "\n" + p2output;
    } else {
        suggestedMovesOutput = p2output + "\n" + p1output;
    }

    battleObj[battleKey].log(suggestedMovesOutput);

    let p1suggestionData = {
        playerName: p1name,
        charName: p1char,
        moveSequence: p1moveSequence,
        buffs: p1buffs,
        positiveStatuses: p1positiveStatuses,
        debuffs: p1debuffs,
        negativeStatuses: p1negativeStatuses,
        moves: p1moves
    };
    let p2suggestionData = {
        playerName: p2name,
        charName: p2char,
        moveSequence: p2moveSequence,
        buffs: p2buffs,
        positiveStatuses: p2positiveStatuses,
        debuffs: p2debuffs,
        negativeStatuses: p2negativeStatuses,
        moves: p2moves
    };

    programSocket.emit('suggestedMoves', {
        battleObj: battleObj,
        battleKey: battleKey,
        turn: turn,
        p1suggestionData: p1suggestionData,
        p2suggestionData: p2suggestionData,
        playerNumberToPrintFirst: playerNumberToPrintFirst,
    });
}

function getMaxLength(chars, property) {
    return chars.reduce((maxLength, char) => {
        return Math.max(maxLength, char[property].toString().length);
    }, 0);
}

// print the move sequence, current buffs, current debuffs, and all the other possible moves that can be made besides 
// the recommended move, in the order of damage decreasing
function printCharacterOtherInformation(battleObj, battleKey, attacker, defender, attackChar, defenseChar, 
                                        moveSequence, turn) {
    let returnStr = "";
    returnStr += printMoveSequence(moveSequence);
    let [modifierStr, buffs, debuffs, positiveStatuses, negativeStatuses] = printModifiers(battleObj, battleKey, attacker, attackChar, turn);
    returnStr += modifierStr;
    let [movesStr, moves] = printMoves(battleObj, battleKey, attacker, defender, attackChar, defenseChar);
    returnStr += movesStr;
    return [returnStr, buffs, debuffs, positiveStatuses, negativeStatuses, moves];
}

function printMoveSequence(moveSequence) {
    // assumes moveSequence has at least one move
    let returnStr = "";
    if (moveSequence.length > 1) {
        returnStr += `\nMove sequence: ${moveSequence[0]}`;
        for (let i = 1; i < moveSequence.length; i++) {
            returnStr += `, ${moveSequence[i]}`;
        } 
        returnStr += ` (${moveSequence.length} moves)`
    } 
    return returnStr;
}

function printModifiers(battleObj, battleKey, playerName, charName, turn) {
    let returnStr = "";
    const buffs = battleObj[battleKey][playerName].chars[charName].buffs;
    const damageBuffs = battleObj[battleKey][playerName].chars[charName].inflictModifiers;
    const receiveBuffs = battleObj[battleKey][playerName].chars[charName].receiveModifiers;
    const debuffs = battleObj[battleKey][playerName].chars[charName].debuffs;
    const positiveStatuses = battleObj[battleKey][playerName].chars[charName].positiveStatuses;
    const negativeStatuses = battleObj[battleKey][playerName].chars[charName].negativeStatuses;
    let buffsArr = [];
    let debuffsArr = [];
    let positiveStatusesArr = [];
    let negativeStatusesArr = [];
    for (let buff of buffs) {
        buffsArr.push({
            name: buff.name,
            turnsRemaining: buff.endTurn - turn
        });
    }
    for (let damageBuff of damageBuffs) {
        buffsArr.push({
            name: `+${damageBuff.amount * 100}% damage`,
            turnsRemaining: damageBuff.endTurn - turn
        });
    }
    for (let receiveBuff of receiveBuffs) {
        buffsArr.push({
            name: `${receiveBuff.amount * 100}% damage received`,
            turnsRemaining: receiveBuff.endTurn - turn
        });
    }
    for (let debuff of debuffs) {
        debuffsArr.push({
            name: debuff.name,
            turnsRemaining: debuff.endTurn - turn
        });
    }
    for (let positiveStatus of positiveStatuses) {
        positiveStatusesArr.push({
            name: positiveStatus.name,
            turnsRemaining: positiveStatus.endTurn - turn
        });
    }
    for (let negativeStatus of negativeStatuses) {
        negativeStatusesArr.push({
            name: negativeStatus.name,
            turnsRemaining: negativeStatus.endTurn - turn
        });
    }

    buffsArr = buffsArr.sort((a, b) => a.turnsRemaining - b.turnsRemaining);
    debuffsArr = debuffsArr.sort((a, b) => a.turnsRemaining - b.turnsRemaining);
    positiveStatusesArr = positiveStatusesArr.sort((a, b) => a.turnsRemaining - b.turnsRemaining);
    negativeStatusesArr = negativeStatusesArr.sort((a, b) => a.turnsRemaining - b.turnsRemaining);
    //JSON.stringify turns Infinity into null, so we turn Infinity into "Infinity" first, 
    //then we can parseFloat it later.
    for (let arr of [buffsArr, debuffsArr, positiveStatusesArr, negativeStatusesArr]) {
        for (let el of arr) {
            if (el.turnsRemaining == Infinity) {
                el.turnsRemaining = "Infinity";
            }
        }
    }

    if (buffsArr.length > 0) {
        returnStr += debuffsArr.length == 0 ? `\nBuffs: ` : `\nBuffs  : `;
        returnStr += `${buffsArr[0].name} ${buffsArr[0].turnsRemaining}`; 
        for (let i = 1; i < buffsArr.length; i++) {
            returnStr += `, ${buffsArr[i].name} ${buffsArr[i].turnsRemaining}`;
        }
    }
    if (positiveStatusesArr.length > 0) {
        returnStr += `\nPositive statuses: ${positiveStatusesArr[0].name} ${positiveStatusesArr[0].turnsRemaining}`; 
        for (let i = 1; i < positiveStatusesArr.length; i++) {
            returnStr += `, ${positiveStatusesArr[i].name} ${positiveStatusesArr[i].turnsRemaining}`;
        }
    }
    if (debuffsArr.length > 0) {
        returnStr += `\nDebuffs: ${debuffs[0].name} ${debuffs[0].endTurn - turn}`; 
        for (let i = 1; i < debuffsArr.length; i++) {
            returnStr += `, ${debuffsArr[i].name} ${debuffsArr[i].turnsRemaining}`;
        }
    }
    if (negativeStatusesArr.length > 0) {
        returnStr += `\nNegative statuses: ${negativeStatusesArr[0].name} ${negativeStatusesArr[0].turnsRemaining}`; 
        for (let i = 1; i < negativeStatusesArr.length; i++) {
            returnStr += `, ${negativeStatusesArr[i].name} ${negativeStatusesArr[i].turnsRemaining}`;
        }
    }
    return [returnStr, buffsArr, debuffsArr, positiveStatusesArr, negativeStatusesArr];
}

function printMoves(battleObj, battleKey, attacker, defender, attackChar, defenseChar) {
    let validMoves = getMovesCharCanMake(battleObj, battleKey, attacker, attackChar);
    let moveDamageObjs = validMoves
                        .map(move => [move, ...calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move)])
                        .sort((a, b) => b[2] - a[2]);
    //moveDamageObj is formatted as [moveName, moveObj, moveDamage, hitType]
    let movesArr = [];
    for (let moveDamageObj of moveDamageObjs) {
        let moveName = moveDamageObj[0];
        let moveDamage = moveDamageObj[2];
        let hitType = moveDamageObj[3];
        let maxVariance = 0.2;
        let lowerBound = Math.max(round(moveDamage * (1 - maxVariance)), 0);
        let upperBound = round(moveDamage * (1 + maxVariance));
        let isFatal = false;
        if (lowerBound >= battleObj[battleKey][defender].chars[defenseChar].resolve) {
            isFatal = true;
        }
        movesArr.push({
            name: moveName, 
            lowerBound: lowerBound,
            upperBound: upperBound,
            hitType: hitType, 
            isFatal: isFatal
        });
    }
    
    let nameLength = getMaxLength(movesArr, 'name');
    let lowerBoundLength = getMaxLength(movesArr, 'lowerBound');
    let upperBoundLength = getMaxLength(movesArr, 'upperBound');
    let hitTypeLength = getMaxLength(movesArr, 'hitType');
    let returnStr = "";

    if (movesArr.length > 0) {
        returnStr += `\nMoves the player can make:`;
        for (let moveDamageObj of movesArr) {
            returnStr += `\n${moveDamageObj.name} ${" ".repeat(nameLength - moveDamageObj.name.length)}`;
            if (moveDamageObj.upperBound > 0) {
                returnStr += `(${moveDamageObj.lowerBound} ${" ".repeat(lowerBoundLength - moveDamageObj.lowerBound.toString().length)}- `
                          + `${moveDamageObj.upperBound}${" ".repeat(upperBoundLength - moveDamageObj.upperBound.toString().length)}) `
                          + `${moveDamageObj.hitType}${" ".repeat(hitTypeLength - moveDamageObj.hitType.length)} `
                          + `${moveDamageObj.isFatal ? "FATAL" : ""}`;
            }
        }
    }
    return [returnStr, movesArr];
}