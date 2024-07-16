import { cancelInput } from "./handleInput.mjs";
import { parseMoveSameChar, getCurrentChar } from "./parseMoveSameChar.mjs";
import { parseMoveDifferentChars } from "./parseMoveDiffChars.mjs";
import { removeExpiredBoosts, applyBoosts } from "./updateBoosts.mjs";
import { removeExpiredStatuses, applyStatuses } from "./updateStatuses.mjs";
import { removeExpiredDamageModifiers, applyDamageModifiers } from "./updateDamageModifiers.mjs";
import { suggestMoves } from "./suggestMove.mjs";
import { emulateMove, emulateAction } from "./emulateMove.mjs";
import { applyTransformation } from "./transform.mjs";
import consts from '../consts.json' assert { type: 'json' };

// identify changes in stats or statuses then update the battleObj accordingly
export async function parseTurnResults(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + " vs. " + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    let turnResults = battleEmbed.fields[2].value;
    cancelInput(battleKey);

    let p1resolvesAfterTurn = getTeamResolvesAfterTurn(1, battleEmbed);
    let p2resolvesAfterTurn = getTeamResolvesAfterTurn(2, battleEmbed);
    let [p1char, p1taggedIn] = getPreviousTurnChar(battleObj, battleKey, p1name, turnResults);
    let [p2char, p2taggedIn] = getPreviousTurnChar(battleObj, battleKey, p2name, turnResults);
    let p1taggedInChar = getCurrentChar(1, battleEmbed);
    let p2taggedInChar = getCurrentChar(2, battleEmbed);

    battleObj[battleKey].log(`Turn ${turn}:\n${turnResults}`);

    fetch(`http://127.0.0.1:${consts.port}/socket/turnResults`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            battleKey: battleKey,
            turn: turn,
            turnResults: turnResults
        })
    });

    applyInnateAbilities(battleObj, battleKey, p1name, p2name, p1char, p2char, turnResults, turn, p1resolvesAfterTurn);
    applyInnateAbilities(battleObj, battleKey, p2name, p1name, p2char, p1char, turnResults, turn, p2resolvesAfterTurn);
    if (p1char == p2char) {
        await parseMoveSameChar(battleObj, p1name, p2name, p1char, battleEmbed, turn, p1resolvesAfterTurn, p2resolvesAfterTurn, p1taggedIn, p2taggedIn);      
    } else {
        parseMoveDifferentChars(battleObj, battleKey, p1name, p2name, p1char, p2char, turnResults, turn, p1resolvesAfterTurn);
        parseMoveDifferentChars(battleObj, battleKey, p2name, p1name, p2char, p1char, turnResults, turn, p2resolvesAfterTurn);
    }
    applyTransformation(battleObj, battleKey, p1name, p1taggedInChar, turn);
    applyTransformation(battleObj, battleKey, p2name, p2taggedInChar, turn);
    updateResolves(battleObj, battleKey, p1name, p1resolvesAfterTurn);
    updateResolves(battleObj, battleKey, p2name, p2resolvesAfterTurn);
    removeExpiredBoosts(battleObj, battleKey, p1name, turn);
    removeExpiredBoosts(battleObj, battleKey, p2name, turn);
    removeExpiredStatuses(battleObj, battleKey, p1name, turn);
    removeExpiredStatuses(battleObj, battleKey, p2name, turn);
    removeExpiredDamageModifiers(battleObj, battleKey, p1name, turn);
    removeExpiredDamageModifiers(battleObj, battleKey, p2name, turn);
    applyBoosts(battleObj, battleKey, p1name);
    applyBoosts(battleObj, battleKey, p2name);
    applyStatuses(battleObj, battleKey, p1name);
    applyStatuses(battleObj, battleKey, p2name);
    applyDamageModifiers(battleObj, battleKey, p1name);
    applyDamageModifiers(battleObj, battleKey, p2name);

    battleObj[battleKey].log("");
    if (p1taggedInChar !== null && p2taggedInChar !== null) {
        suggestMoves(battleObj, p1name, p2name, p1taggedInChar, p2taggedInChar, turn);
        battleObj[battleKey].log("");
    }

    battleObj[battleKey][p1name].previousTaggedInChar = p1taggedInChar;
    battleObj[battleKey][p2name].previousTaggedInChar = p2taggedInChar;
}

// create an object containing key-value pairs of characters and their new resolves
function getTeamResolvesAfterTurn(playerNumber, battleEmbed) {
    let resolveRegex = / (\*__(.+)__\*\*\*|\*(.+)\*) - \*\*(\d+)\*\*:heart:/g;
    let deadRegex = / \*(.+)\* :x:/g;
    let returnObj = {}
    let charName = "";

    while (true) {
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

    while (true) {
        let deadMatch = deadRegex.exec(battleEmbed.fields[playerNumber - 1].value);
        if (deadMatch === null) {
            break;
        }
        charName = deadMatch[1];
        returnObj[charName] = 0;
    }

    return returnObj;
}

// get the name of the character that will be used to determine attack and defense char for this turn
function getPreviousTurnChar(battleObj, battleKey, playerName, turnResults) {
    let charName;
    let taggedIn = false;
    let playerID = battleObj[battleKey][playerName].id;

    let taggedInRegex = /^(\*\*<@(\d+)>\*\* tagged in \*\*(.+)\*\*!\n)?(\*\*<@(\d+)>\*\* tagged in \*\*(.+)\*\*!)?/;
    let taggedInMatch = taggedInRegex.exec(turnResults);

    if (taggedInMatch[2] == playerID) {
        charName = taggedInMatch[3];
        taggedIn = true;
    } else if (taggedInMatch[5] == playerID) {
        charName = taggedInMatch[6];
        taggedIn = true;
    } else {
        charName = battleObj[battleKey][playerName].previousTaggedInChar;
    }

    return [charName, taggedIn];
}

// emulate the effects of innate abilities
function applyInnateAbilities(battleObj, battleKey, attacker, defender, attackChar, 
                              defenseChar, turnResults, turn, attackerResolves) {
    let attackerPreviousTaggedInChar = battleObj[battleKey][attacker].previousTaggedInChar;
    let attackerID = battleObj[battleKey][attacker].id;

    for (let char in battleObj[battleKey][attacker].chars) {
        if (battleObj[battleKey][attacker].chars[char].resolve != 0 && attackerResolves[char] == 0) {
            emulateAction(battleObj, battleKey, attacker, defender, char, defenseChar, "Defeat", turnResults, turn, attackerResolves);
        }
    }

    if (turn == 1) {
        for (let charKey in battleObj[battleKey][attacker].chars) {
            emulateAction(battleObj, battleKey, attacker, defender, charKey, defenseChar, "Game Start", turnResults, turn, attackerResolves);
        }
    }

    let taggedInStr = `\\*\\*<@${attackerID}>\\**\\** tagged in \\*\\*(.+)\\*\\*!`;
    let taggedInRegex = new RegExp(taggedInStr);
    let taggedInMatch = taggedInRegex.exec(turnResults);
    if (taggedInMatch !== null) {
        let taggedInChar = taggedInMatch[1];
        emulateAction(battleObj, battleKey, attacker, defender, taggedInChar, defenseChar, "Tag-in", turnResults, turn, attackerResolves);
    }


    if (battleObj[battleKey][attacker].chars[attackChar]?.moves.includes("Zenith Pace") && attackerPreviousTaggedInChar !== null) {
        emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Zenith Pace", turnResults, turn, attackerResolves);
    }
}

function updateResolves(battleObj, battleKey, playerName, playerResolves) {
    for (let charKey in battleObj[battleKey][playerName].chars) {
        battleObj[battleKey][playerName].chars[charKey].resolve = playerResolves[charKey];
    }
}