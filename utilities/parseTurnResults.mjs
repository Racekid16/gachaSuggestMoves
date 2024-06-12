import { addBoost, addBoostToAliveTeammates, removeExpiredBoosts, hasBoost } from "./updateBoosts.mjs";
import { addStatus, removeExpiredStatuses } from "./updateStatuses.mjs";
import { suggestMoves } from "./suggestMove.mjs";
import consts from '../consts.json' assert { type: 'json' };

// decrypt the turn results to determine if moves that affect stats or statuses were used,
// then update the stats and statuses accordingly
export function parseTurnResults(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    let turnResults = battleEmbed.fields[2].value;

    //TODO: remove this
    battleObj[battleKey].log(`${p1name}'s previous tagged-in character was ${battleObj[battleKey][p1name].previousTaggedInChar}`);
    battleObj[battleKey].log(`${p2name}'s previous tagged-in character was ${battleObj[battleKey][p2name].previousTaggedInChar}`);

    //remove the .replace part if you're testing
    battleObj[battleKey].log(`Turn ${turn}:\n${turnResults}`);

    //determine player resolves
    let p1resolvesAfterTurn = getTeamResolves(1, battleEmbed);
    let p2resolvesAfterTurn = getTeamResolves(2, battleEmbed);

    //determine what characters each player used this turn
    let p1char = getPreviousTurnChar(battleObj, battleKey, p1name, turnResults);
    let p2char = getPreviousTurnChar(battleObj, battleKey, p2name, turnResults);

   if (p1char == p2char) {
        parseMoveSameChar(battleObj, p1name, p2name, p1char, turnResults, p1resolvesAfterTurn, p2resolvesAfterTurn);      
    } else {
        parseMoveDifferentChars(battleObj, battleKey, p1name, p2name, p1char, p2char, turnResults, turn, p1resolvesAfterTurn);
        parseMoveDifferentChars(battleObj, battleKey, p2name, p1name, p2char, p1char, turnResults, turn, p2resolvesAfterTurn);
    }

    let p1taggedInChar = getCurrentChar(1, battleEmbed);
    let p2taggedInChar = getCurrentChar(2, battleEmbed);

    //TODO: remove this
    battleObj[battleKey].log(`${p1name}'s current tagged-in char is ${p1taggedInChar}`);
    battleObj[battleKey].log(`${p2name}'s current tagged-in char is ${p2taggedInChar}`);

    applyTransformation(battleObj, battleKey, p1name, p1taggedInChar);
    applyTransformation(battleObj, battleKey, p2name, p2taggedInChar);
    updateResolves(battleObj, battleKey, p1name, p1resolvesAfterTurn);
    updateResolves(battleObj, battleKey, p2name, p2resolvesAfterTurn);
    removeExpiredBoosts(battleObj, battleKey, p1name, turn);
    removeExpiredBoosts(battleObj, battleKey, p2name, turn);
    removeExpiredStatuses(battleObj, battleKey, p1name, turn);
    removeExpiredStatuses(battleObj, battleKey, p2name, turn);

    battleObj[battleKey].log("");
    if (p1taggedInChar !== null && p2taggedInChar !== null) {
        suggestMoves(battleObj, p1name, p2name, p1taggedInChar, p2taggedInChar, turn);
        battleObj[battleKey].log("");
    }

    battleObj[battleKey][p1name].previousTaggedInChar = p1taggedInChar;
    battleObj[battleKey][p2name].previousTaggedInChar = p2taggedInChar;
}

// get the name of the character that will be used to determine attack and defense char for this turn
function getPreviousTurnChar(battleObj, battleKey, playerName, turnResults) {
    let charName;
    let playerID = battleObj[battleKey][playerName].id;
    let taggedInRegex = /^(\*\*<@(\d+)>\*\* tagged in \*\*(.+)\*\*!\n)?(\*\*<@(\d+)>\*\* tagged in \*\*(.+)\*\*!)?/;
    let taggedInMatch = taggedInRegex.exec(turnResults);

    if (taggedInMatch[2] == playerID) {
        charName = taggedInMatch[3];
    } else if (taggedInMatch[5] == playerID) {
        charName = taggedInMatch[6];
    } else {
        charName = battleObj[battleKey][playerName].previousTaggedInChar;
    }

    return charName;
    
}

// create an object containing key-value pairs of characters and their new resolves
function getTeamResolves(playerNumber, battleEmbed) {
    let resolveRegex = / (\*__(.+)__\*\*\*|\*(.+)\*) - \*\*(\d+)\*\*:heart:/g;
    let deadRegex = / \*(.+)\* :x:/g;
    let returnObj = {}
    let charName = "";

    for (let i = 0; i < 3; i++) {
        let resolveMatch = resolveRegex.exec(battleEmbed.fields[playerNumber - 1].value);
        if (resolveMatch === null) {
            break;
        }
        if (typeof resolveMatch[2] !== 'undefined') {
            charName = resolveMatch[2];
        } else {    //typeof resolveMatch[3] !== 'undefined'
            charName = resolveMatch[3];
        }
        let charResolve = parseInt(resolveMatch[4]);
        returnObj[charName] = charResolve;
    }
    for (let i = 0; i < 3; i++) {
        let deadMatch = deadRegex.exec(battleEmbed.fields[playerNumber - 1].value);
        if (deadMatch === null) {
            break;
        }
        charName = deadMatch[1];
        returnObj[charName] = 0;
    }

    return returnObj;
}

// determine whether the characters used a move that affects non-resolve stats, 
// where both players used the same character
function parseMoveSameChar(battleObj, p1name, p2name, charName, turnResults, turn, p1resolves, p2resolves) {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
}

// determine whether the characters used a move that affects non-resolve stats, 
// where both players used a different character
function parseMoveDifferentChars(battleObj, battleKey, attacker, defender, attackChar, 
                                 defenseChar, turnResults, turn, attackerResolves) {
    let attackerID = battleObj[battleKey][attacker].id;
    let previousTaggedInChar = battleObj[battleKey][attacker].previousTaggedInChar;

    if (turnResults.includes(`**${attackChar}** used **Arrogance**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Arrogance", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Blazing Form**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Blazing Form", turn);
    }

    if (previousTaggedInChar !== null && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Boss Orders") 
     && attackerResolves[previousTaggedInChar] == 0) {
        addBoostToAliveTeammates(battleObj, battleKey, attacker, "Boss Orders", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Charm**!`)) {
        addBoost(battleObj, battleKey, defender, defenseChar, "Charm", turn);
        if (typeof battleObj[battleKey][attacker].chars[attackChar].secrets === 'undefined') {
            battleObj[battleKey][attacker].chars[attackChar].secrets = new Set();
        }
        battleObj[battleKey][attacker].chars[attackChar].secrets.add(defenseChar);
    }

    if (turnResults.includes(`**${attackChar}** used **Dominate**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Dominate", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **From The Shadows**!`)) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Trapped", turn, 3);
        
        let fromTheShadowsStr = `\\*\\*${attackChar}\\*\\* used \\*\\*From The Shadows\\*\\*!\\n\\*\\*.+\\*\\* is \\*\\*Trapped\\*\\* for 3 turns!\\n\\*\\*<@${attackerID}>\\*\\* tagged in \\*\\*(.+)\\*\\*!`;
        let fromTheShadowsRegex = new RegExp(fromTheShadowsStr);
        let fromTheShadowsMatch = fromTheShadowsRegex.exec(turnResults);

        if (fromTheShadowsMatch !== null) {
            let taggedInChar = fromTheShadowsMatch[1];
            addStatus(battleObj, battleKey, attacker, taggedInChar, "Pacified", turn, 1);
            addStatus(battleObj, battleKey, attacker, taggedInChar, "Invulnerable", turn, 1);
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Hate**!`)) {
        let defenderHasHateDebuff = hasBoost(battleObj, battleKey, defender, defenseChar, "Hate");
        if (!defenderHasHateDebuff) {
            addBoost(battleObj, battleKey, defender, defenseChar, "Hate", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Humiliate**!`)) {
        addBoost(battleObj, battleKey, defender, defenseChar, "Humiliate", turn);
        let statusStr = `\\*\\*${attackChar}\\*\\* used \\*\\*Humiliate\\*\\*!\\n(\\*\\*.+\\*\\*'s \\*\\*.+\\*\\* was weakened!\\n)?\\*\\*.+\\*\\* is \\*\\*(.+)\\*\\* for (\\d+) turns?!`;
        let statusRegex = new RegExp(statusStr);
        let statusMatch = statusRegex.exec(turnResults);

        if (statusMatch !== null) {
            let status = statusMatch[2];
            let numTurns = parseInt(statusMatch[3]);
            addStatus(battleObj, battleKey, defender, defenseChar, status, turn, numTurns);
        } else {
            console.log(`No new status for ${defenseChar} was found in turn ${turn} of ${battleKey}`);
        }
    }

    if (turnResults.includes(`**${attackChar}** is preparing **Introversion**...`)) {
        let [lowestResolveTeammateName, lowestResolveTeammate] = 
            Object.entries(battleObj[battleKey][attacker].chars).reduce((minEntry, currentEntry) => {
                return (currentEntry[0] != attackChar && currentEntry[1].resolve > 0 && currentEntry[1].resolve < minEntry[1].resolve) ? currentEntry : minEntry;
            }, ["Empty", { resolve: Infinity }]);

        if (lowestResolveTeammateName != "Empty") {
            if (attackerResolves[lowestResolveTeammateName] != 0) {
                console.log(`Program expected ${attacker}'s ${lowestResolveTeammateName} in ${battleKey} to die, but they didn't.`);
            }

            for (let buff of lowestResolveTeammate.buffs) {
                addBoost(battleObj, battleKey, attacker, attackChar, buff.name, buff.startTurn);
            }
        }

        if (turnResults.includes(`**${attackChar}** countered with **Introversion**!`)) {
            addBoost(battleObj, battleKey, attacker, attackChar, "Introversion", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}** is preparing **Kabedon**...`)) {
        battleObj[battleKey][attacker].chars[attackChar].canUseKabedon = false;
        if (turnResults.includes(`**${attackChar}** countered with **Kabedon**!`)) {
            addStatus(battleObj, battleKey, defender, defenseChar, "Stunned", turn, 1);
        } else if (turnResults.includes(`**${attackChar}'s** counter failed!`)) {
            addStatus(battleObj, battleKey, attacker, attackChar, "Stunned", turn, 1);
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Kings Command**!\n**${attackChar}** summoned a **Pawn**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Kings Command", turn);
    }

    if (turnResults.includes(`**<@${attackerID}>** tagged in **${attackChar}**!`) && previousTaggedInChar !== null 
     && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Lead By Example")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "1-turn Lead By Example", turn);
        addBoost(battleObj, battleKey, attacker, attackChar, "2-turn Lead By Example", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Provoke**!`)) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Taunted", turn, 3);
    }
    
    if (turnResults.includes(`**${attackChar}** used **Slap**!`)) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Wounded", turn, 3);
    }

    if (turnResults.includes(`**${attackChar}** used **Slumber**!`)) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Pacified", turn, 1);
        addStatus(battleObj, battleKey, attacker, attackChar, "Resting", turn, 2);
    }

    if (turnResults.includes(`**${attackChar}** used **Study**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Study Initiative", turn);
        addBoost(battleObj, battleKey, attacker, attackChar, "Study Mental", turn);
    }

    // handle both The Perfect Existence and Kabedon tagging in here
    let taggedInStr = `\\*\\*<@${attackerID}>\\**\\** tagged in \\*\\*(.+)\\*\\*!`;
    let taggedInRegex = new RegExp(taggedInStr);
    let taggedInMatch = taggedInRegex.exec(turnResults);
    if (taggedInMatch !== null) {
        let taggedInChar = taggedInMatch[1];
        if (battleObj[battleKey][attacker].chars[taggedInChar].moves.includes("Kabedon")) {
            battleObj[battleKey][attacker].chars[taggedInChar].canUseKabedon = true;
        }
        if (battleObj[battleKey][attacker].chars[taggedInChar].moves.includes("The Perfect Existence")) {
            for (let debuff of battleObj[battleKey][attacker].chars[taggedInChar].debuffs) {
                debuff.endTurn = turn;
            }
        }
    }

    if (turnResults.includes(`On the brink of defeat, **${attackChar}** hung on!`)
     && battleObj[battleKey][attacker].chars[attackChar].moves.includes("The Perfect Existence")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "The Perfect Existence", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Unity**!`)) {
        let attackerHasUnityBuff = hasBoost(battleObj, battleKey, attacker, attackChar, "Unity");
        if (!attackerHasUnityBuff) {
            addBoostToAliveTeammates(battleObj, battleKey, attacker, "Unity", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}**'s **Initiative** was boosted!`)
     && battleObj[battleKey][attacker].chars[attackChar].moves.includes("Zenith Pace")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Zenith Pace", turn);
    }
    
}

// determine what character the player is used for this turn
// and set the player's taggedInChar property
function getCurrentChar(playerNumber, battleEmbed) {
    let taggedInCharRegex = /__(.+)__/;
    let charName = taggedInCharRegex.exec(battleEmbed.fields[playerNumber - 1].value)?.[1];

    if (typeof charName === 'undefined') {
        return null;
    } 
    return charName;
}

// charName is the current tagged-in char after the turn that was just parsed
// and the one you'll transform into, if applicable
function applyTransformation(battleObj, battleKey, playerName, charName) {
    if (charName !== null && typeof battleObj[battleKey][playerName].chars[charName] === 'undefined'
     && consts.transformChars.includes(battleObj[battleKey][playerName].previousTaggedInChar)) {
        switch (charName) {

            case "Serious Kōenji Rokusuke":
                battleObj[battleKey][playerName].chars[charName] = structuredClone(battleObj[battleKey][playerName].chars["Perfect Kōenji Rokusuke"]);
                battleObj[battleKey][playerName].initialCharStats[charName] = structuredClone(battleObj[battleKey][playerName].initialCharStats["Perfect Kōenji Rokusuke"]);
                //note: Serious Koenji's moves are updated when The Perfect Existence buff is added
                delete battleObj[battleKey][playerName].chars["Perfect Kōenji Rokusuke"];
                delete battleObj[battleKey][playerName].initialCharStats["Perfect Kōenji Rokusuke"];
                break;

            case "True Kushida Kikyō":
                battleObj[battleKey][playerName].chars[charName] = structuredClone(battleObj[battleKey][playerName].chars["Unmasked Kushida Kikyō"]);
                battleObj[battleKey][playerName].chars[charName].moves = ["Scheming", "Fighting", "Shatter", "Mask"];
                battleObj[battleKey][playerName].initialCharStats[charName] = structuredClone(battleObj[battleKey][playerName].initialCharStats["Unmasked Kushida Kikyō"]);
                battleObj[battleKey][playerName].initialCharStats[charName].moves = ["Scheming", "Fighting", "Shatter", "Mask"];
                delete battleObj[battleKey][playerName].chars["Unmasked Kushida Kikyō"];
                delete battleObj[battleKey][playerName].initialCharStats["Unmasked Kushida Kikyō"];
                break;

            case "Unmasked Kushida Kikyō":
                battleObj[battleKey][playerName].chars[charName] = structuredClone(battleObj[battleKey][playerName].chars["True Kushida Kikyō"]);
                battleObj[battleKey][playerName].chars[charName].moves = ["Academic", "Empathy", "Charm", "Unmask"];
                battleObj[battleKey][playerName].initialCharStats[charName] = structuredClone(battleObj[battleKey][playerName].initialCharStats["True Kushida Kikyō"]);
                battleObj[battleKey][playerName].initialCharStats[charName].moves = ["Academic", "Empathy", "Charm", "Unmask"];
                delete battleObj[battleKey][playerName].chars["True Kushida Kikyō"];
                delete battleObj[battleKey][playerName].initialCharStats["True Kushida Kikyō"];
                break;
        }
    }
}

function updateResolves(battleObj, battleKey, playerName, playerResolves) {
    for (let charKey in playerResolves) {
        battleObj[battleKey][playerName].chars[charKey].resolve = playerResolves[charKey];
    }
}