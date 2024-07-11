// pretty-print people's parties and suggested moves.
import { round } from './round.mjs';
import { calculateMoveDamage } from './calculateMoveDamage.mjs';
import { hasStatus } from './updateStatuses.mjs';
import consts from '../consts.json' assert { type: 'json' };

// print the stats of a party at the beginning of a battle
export function printParty(battleObj, battleKey, playerName, partyJSON, hasStrength) {
    let charStats = battleObj[battleKey][playerName].chars;

    let printStrength = hasStrength ? '(Strength 3: +10% to stats)' : '';
    battleObj[battleKey].log(`${playerName}'s party ${printStrength}\nActive:`);    

    let activeChars = [];
    for (let i = 0; i < 3; i++) {
        if (partyJSON[i].name != "empty") {
            activeChars.push(charStats[partyJSON[i].name]);
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
        if (partyJSON[i].name != "empty") {
            benchChars.push(charStats[partyJSON[i].name]);
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
export function printSuggestedMoves(battleObj, p1name, p2name, p1char, p2char, p1move, p2move, 
                                    p1moveObj, p2moveObj, p1damage, p2damage, p1hitType, p2hitType) {
    let battleKey = p1name + " vs. " + p2name;
    
    let p1inflictMultiplier = battleObj[battleKey][p1name].chars[p1char].inflictMultiplier - 1;
    let p1printInflict = p1inflictMultiplier != 0 ? `💥+${p1inflictMultiplier * 100}% ` : '';
    let p2inflictMultiplier = battleObj[battleKey][p2name].chars[p2char].inflictMultiplier - 1;
    let p2printInflict = p2inflictMultiplier != 0 ? `💥+${p2inflictMultiplier * 100}% ` : '';
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
    
    let p1printFatal = p1lowerBound > p2resolve ? 'FATAL' : '';
    let p2printFatal = p2lowerBound > p1resolve ? 'FATAL' : '';

    let p1Output =  `${p1name} ${" ".repeat(playerNameLength - p1name.length)}` 
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
        p1Output += `(${p1lowerBound} ${" ".repeat(lowerBoundLength - p1lowerBound.toString().length)}- `
                  + `${p1upperBound}${" ".repeat(upperBoundLength - p1upperBound.toString().length)}) `
                  + `${p1hitType} ${p1printFatal}`;
    }
    p1Output += printOtherMoves(battleObj, battleKey, p1name, p2name, p1char, p2char, p1move);
            
    let p2Output =  `${p2name} ${" ".repeat(playerNameLength - p2name.length)}`
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
        p2Output += `(${p2lowerBound} ${" ".repeat(lowerBoundLength - p2lowerBound.toString().length)}- `
                  + `${p2upperBound}${" ".repeat(upperBoundLength - p2upperBound.toString().length)}) `
                  + `${p2hitType} ${p2printFatal}`;
    }
    p2Output += printOtherMoves(battleObj, battleKey, p2name, p1name, p2char, p1char, p2move);
    
    let p1priority = p1moveObj.priority;
    let p2priority = p2moveObj.priority;
    
    if (p1priority > p2priority) {
        battleObj[battleKey].log(p1Output);
        battleObj[battleKey].log(p2Output);
    }
    else if (p2priority > p1priority) {
        battleObj[battleKey].log(p2Output);
        battleObj[battleKey].log(p1Output);
    }
    else if (p1initiative >= p2initiative) {
        battleObj[battleKey].log(p1Output);
        battleObj[battleKey].log(p2Output);
    } 
    else {    //p1initiative < p2initiative
        battleObj[battleKey].log(p2Output);
        battleObj[battleKey].log(p1Output);
    }
}

function getMaxLength(chars, property) {
    return chars.reduce((maxLength, char) => {
        return Math.max(maxLength, char[property].toString().length);
    }, 0);
}

// print all the other possible moves that can be made besides the recommended move,
// in the order of damage decreasing
function printOtherMoves(battleObj, battleKey, attacker, defender, attackChar, defenseChar, recommendedMove) {
    let validMoves = battleObj[battleKey][attacker].chars[attackChar].moves
        .filter(move => !consts.moveInfo[move].type.includes("innate") && move != recommendedMove);
    let moveDamageObjs = [];
    for (let move of validMoves) {
        let moveDamageObj = calculateMoveDamage(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move);
        //moveDamageObj is formatted as [moveObj, moveDamage, hitType]
        if (moveDamageObj[1] == -1 || hasStatus(battleObj, battleKey, attacker, attackChar, "Stunned")) {
            continue;
        }
        if (moveDamageObj[0].type.includes("Attack") && hasStatus(battleObj, battleKey, attacker, attackChar, "Pacified")) {
            continue;   
        }
        if (!moveDamageObj[0].type.includes("Attack") && hasStatus(battleObj, battleKey, attacker, attackChar, "Taunted")) {
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
    let returnStr = "";
    moveDamageObjs = moveDamageObjs.sort((a, b) => b[2] - a[2]);
    //moveDamageObj is formatted as [moveName, moveObj, moveDamage, hitType]
    for (let moveDamageObj of moveDamageObjs) {
        returnStr += `\n${moveDamageObj[0]} `;
        let moveDamage = moveDamageObj[2];
        if (moveDamage != 0) {
            let maxVariance = 0.2;
            let lowerBound = Math.max(round(moveDamage * (1 - maxVariance)), 0);
            let upperBound = round(moveDamage * (1 + maxVariance));
            returnStr += `(${lowerBound} - ${upperBound}) ${moveDamageObj[3]}`;
        }
    }
    return returnStr;
}