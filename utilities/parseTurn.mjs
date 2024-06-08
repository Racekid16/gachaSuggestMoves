import { addBoost, checkBoostsExpired } from "./updateBoosts.mjs";
import { suggestMove } from "./suggestMove.mjs";

export function parseTurn(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    let turnResults = battleEmbed.fields[2].value;
    //TODO: comment this
    console.log(`Turn ${turn} of ${battleKey}:\n${turnResults}\n`);

    //determine player resolves
    let p1Resolves = getTeamResolves(1, battleEmbed);
    let p2Resolves = getTeamResolves(2, battleEmbed);

    //determine what characters each player used
    let p1char = getPlayerCharacter(battleObj, battleKey, p1name, 1, battleEmbed);
    let p2char = getPlayerCharacter(battleObj, battleKey, p2name, 2, battleEmbed);

    if (p1char == p2char) {
        parseTurnSameChar(battleObj, p1name, p2name, p1char, turnResults, p1Resolves, p2Resolves);      
    }
    else {
        parseTurnDifferentChars(battleObj, p1name, p2name, p1char, p2char, turnResults, p1Resolves, p2Resolves);
    }

    checkBoostsExpired(battleObj, battleKey, p1name, turn);
    checkBoostsExpired(battleObj, battleKey, p2name, turn);
    updateResolves(battleObj, battleKey, p1name, p1Resolves);
    updateResolves(battleObj, battleKey, p2name, p2Resolves);
    suggestMove(battleObj, battleKey, p1name, p2name);
    suggestMove(battleObj, battleKey, p2name, p1name);
}

// determine what character the player is using (or used if they died)
// and set the player's currentChar property
function getPlayerCharacter(battleObj, battleKey, playerName, playerNumber, battleEmbed) {
    //determine what characters each player used
    let currentCharRegex = /__(.+)__/;
    let charName = currentCharRegex.exec(battleEmbed.fields[playerNumber - 1].value)?.[1];

    // if the player's character was defeated, set their char equal to their previous turn's char
    if (typeof charName === 'undefined') {
        charName = battleObj[battleKey][playerName].currentChar;
        battleObj[battleKey][playerName].currentChar = null;
    } else {
        battleObj[battleKey][playerName].currentChar = charName;
    }

    return charName;
}

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

function parseTurnSameChar(battleObj, p1name, p2name, p1char, p2char, turnResults, p1Resolves, p2Resolves) {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
}

function parseTurnDifferentChars(battleObj, p1name, p2name, p1char, p2char, turnResults, p1Resolves, p2Resolves) {
    let players = [p1name, p2name];
    let chars = [p1char, p2char];

    for (let i = 0; i < chars.length; i++) {
        let attacker = players[i];
        let defender = players[(i + 1) % 2];
        let attackChar = chars[i];
        let defenseChar = chars[(i + 1) % 2];

    }
}

function updateResolves(battleObj, battleKey, playerName, playerResolves) {
    for (let charKey in playerResolves) {
        battleObj[battleKey][playerName].chars[charKey].resolve = playerResolves[charKey];
    }
}