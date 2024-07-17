// pretty-print people's parties and suggested moves.
import { round } from './round.mjs';
import { calculateMoveDamage } from './calculateMoveDamage.mjs';
import { hasStatus } from './updateStatuses.mjs';
import consts from '../consts.json' assert { type: 'json' };

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
            case 'Ability': supportCategorySymbol = "🏃🧠💪🗣️"; break;
            case 'Initiative': supportCategorySymbol = "🏃"; break;
            case 'Mental': supportCategorySymbol = "🧠"; break;
            case 'Physical': supportCategorySymbol = "💪"; break;
            case 'Social': supportCategorySymbol = "🗣️"; break;
            case 'Resolve': supportCategorySymbol = "❤️"; break;
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
export function printSuggestedMoves(battleObj, p1name, p2name, p1char, p2char, p1moveSequence, p2moveSequence,
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
    
    let p1printFatal = p1lowerBound >= p2resolve ? 'FATAL' : '';
    let p2printFatal = p2lowerBound >= p1resolve ? 'FATAL' : '';

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
                  + `${p1hitType} ${p1printFatal}`;
    }
    p1output += printCharacterOtherInformation(battleObj, battleKey, p1name, p2name, p1char, p2char, p1moveSequence, p1move, turn);
            
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
                  + `${p2hitType} ${p2printFatal}`;
    }
    p2output += printCharacterOtherInformation(battleObj, battleKey, p2name, p1name, p2char, p1char, p2moveSequence, p2move, turn);
    
    let p1priority = p1moveObj.priority;
    let p2priority = p2moveObj.priority;

    let suggestedMovesOutput = "";
    
    if (p1priority > p2priority) {
        suggestedMovesOutput = p1output + "\n" + p2output;
    }
    else if (p2priority > p1priority) {
        suggestedMovesOutput = p2output + "\n" + p1output; 
    }
    else if (p1initiative >= p2initiative) {
        suggestedMovesOutput = p1output + "\n" + p2output;
    } 
    else {    //p1initiative < p2initiative
        suggestedMovesOutput = p2output + "\n" + p1output;
    }

    battleObj[battleKey].log(suggestedMovesOutput);

    //TODO: finish this, this is just temporary
    fetch(`http://127.0.0.1:${consts.port}/socket/suggestedMoves`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            battleKey: battleKey,
            text: suggestedMovesOutput
        })
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
                                        moveSequence, recommendedMove, turn) {
    let returnStr = "";
    returnStr += printMoveSequence(moveSequence);
    returnStr += printModifiers(battleObj, battleKey, attacker, attackChar, turn);
    returnStr += printOtherMoves(battleObj, battleKey, attacker, defender, attackChar, defenseChar, recommendedMove);
    return returnStr;
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
    if (buffs.length > 0 || damageBuffs.length > 0 ||receiveBuffs.length > 0) {
        returnStr += debuffs.length == 0 ? `\nBuffs: ` : `\nBuffs  : `;
        
    }
    if (buffs.length > 0) {
        returnStr += `${buffs[0].name} ${buffs[0].endTurn - turn}`; 
        for (let i = 1; i < buffs.length; i++) {
            returnStr += `, ${buffs[i].name} ${buffs[i].endTurn - turn}`;
        }
    }
    if (damageBuffs.length > 0) {
        let startIndex = buffs.length > 0 ? 0 : 1;
        if (startIndex) {   //nonzero numbers evaluate to true
            returnStr += `+${damageBuffs[0].amount * 100}% damage ${damageBuffs[0].endTurn - turn}`;
        }
        for (let i = startIndex; i < damageBuffs.length; i++) {
            returnStr += `, +${damageBuffs[i].amount * 100}% damage ${damageBuffs[i].endTurn - turn}`;
        }
    }
    if (receiveBuffs.length > 0) {
        let startIndex = (buffs.length > 0 || damageBuffs.length > 0) ? 0 : 1;
        if (startIndex) {   //nonzero numbers evaluate to true
            returnStr += `${receiveBuffs[0].amount * 100}% damage received ${receiveBuffs[0].endTurn - turn}`;
        }
        for (let i = startIndex; i < receiveBuffs.length; i++) {
            returnStr += `, ${receiveBuffs[i].amount * 100}% damage received ${receiveBuffs[i].endTurn - turn}`;
        }
    }
    const positiveStatuses = battleObj[battleKey][playerName].chars[charName].positiveStatuses;
    if (positiveStatuses.length > 0) {
        returnStr += `\nPositive statuses: ${positiveStatuses[0].name} ${positiveStatuses[0].endTurn - turn}`; 
        for (let i = 1; i < positiveStatuses.length; i++) {
            returnStr += `, ${positiveStatuses[i].name} ${positiveStatuses[i].endTurn - turn}`;
        }
    }
    if (debuffs.length > 0) {
        returnStr += `\nDebuffs: ${debuffs[0].name} ${debuffs[0].endTurn - turn}`; 
        for (let i = 1; i < debuffs.length; i++) {
            returnStr += `, ${debuffs[i].name} ${debuffs[i].endTurn - turn}`;
        }
    }
    const negativeStatuses = battleObj[battleKey][playerName].chars[charName].negativeStatuses;
    if (negativeStatuses.length > 0) {
        returnStr += `\nNegative statuses: ${negativeStatuses[0].name} ${negativeStatuses[0].endTurn - turn}`; 
        for (let i = 1; i < negativeStatuses.length; i++) {
            returnStr += `, ${negativeStatuses[i].name} ${negativeStatuses[i].endTurn - turn}`;
        }
    }
    return returnStr;
}

function printOtherMoves(battleObj, battleKey, attacker, defender, attackChar, defenseChar, recommendedMove) {
    let validMoves = battleObj[battleKey][attacker].chars[attackChar].moves
        .filter(move => !consts.moveInfo[move].type.includes("innate") && move != recommendedMove);
    let moveDamageObjs = [];
    for (let move of validMoves) {
        let moveDamageObj = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move);
        //moveDamageObj is formatted as [moveObj, moveDamage, hitType]
        if (moveDamageObj[1] == -1 || hasStatus(battleObj, battleKey, attacker, attackChar, "Stunned") || hasStatus(battleObj, battleKey, attacker, attackChar, "Resting")) {
            continue;
        }
        if (moveDamageObj[0].type.includes("attack") && hasStatus(battleObj, battleKey, attacker, attackChar, "Pacified")) {
            continue;   
        }
        if (!moveDamageObj[0].type.includes("attack") && hasStatus(battleObj, battleKey, attacker, attackChar, "Taunted")) {
            continue;
        }
        if (move == "Kabedon" && battleObj[battleKey][attacker].chars[attackChar].canUseKabedon != true) {
            continue;
        }
        if (hasStatus(battleObj, battleKey, defender, defenseChar, "Invulnerable")) {
            moveDamageObj[1] = 0;
        }
        moveDamageObjs.push([move, ...moveDamageObj]);
    }
    if (!hasStatus(battleObj, battleKey, attacker, attackChar, "Trapped") && !hasStatus(battleObj, battleKey, attacker, attackChar, "Taunted")) {
        let numAliveAllies = Object.keys(battleObj[battleKey][attacker].chars).reduce((countSoFar, charKey) => 
            battleObj[battleKey][attacker].chars[charKey].resolve > 0 ? countSoFar + 1 : countSoFar
        , 0);
        if (numAliveAllies > 1) {
            moveDamageObjs.push(["Switch-in", {}, 0, '        ']);
        }
    }
    
    moveDamageObjs = moveDamageObjs.sort((a, b) => b[2] - a[2]);
    //moveDamageObj is formatted as [moveName, moveObj, moveDamage, hitType]
    let printArr = [];
    for (let moveDamageObj of moveDamageObjs) {
        let moveName = moveDamageObj[0];
        let moveDamage = moveDamageObj[2];
        let isCritical = moveDamageObj[3];
        let maxVariance = 0.2;
        let lowerBound = Math.max(round(moveDamage * (1 - maxVariance)), 0);
        let upperBound = round(moveDamage * (1 + maxVariance));
        let isFatal = '';
        if (lowerBound >= battleObj[battleKey][defender].chars[defenseChar].resolve) {
            isFatal = 'FATAL'
        }
        printArr.push([moveName, lowerBound, upperBound, isCritical, isFatal]);
    }
    let nameLength = getMaxLength(printArr, 0);
    let lowerBoundLength = getMaxLength(printArr, 1);
    let upperBoundLength = getMaxLength(printArr, 2);
    let returnStr = "";
    if (printArr.length > 0) {
        returnStr += `\nOther moves the player can make:`;
        for (let moveArr of printArr) {
            returnStr += `\n${moveArr[0]} ${" ".repeat(nameLength - moveArr[0].length)}`;
            if (moveArr[1] > 0) {
                returnStr += `(${moveArr[1]} ${" ".repeat(lowerBoundLength - moveArr[1].toString().length)}- `
                          + `${moveArr[2]}${" ".repeat(upperBoundLength - moveArr[2].toString().length)}) `
                          + `${moveArr[3]} ${moveArr[4]}`;
            }
        }
    }
    return returnStr;
}