import { parseMoveSameChar } from "./parseMoveSameChar.mjs";
import { parseMoveDifferentChars } from "./parseMoveDiffChars.mjs";
import { addBoost, removeExpiredBoosts } from "./updateBoosts.mjs";
import { removeExpiredStatuses } from "./updateStatuses.mjs";
import { suggestMoves } from "./suggestMove.mjs";
import consts from '../consts.json' assert { type: 'json' };

// identify changes in stats or statuses then update the battleObj accordingly
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
    let p1resolvesAfterTurn = getTeamResolvesAfterTurn(1, battleEmbed);
    let p2resolvesAfterTurn = getTeamResolvesAfterTurn(2, battleEmbed);

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

    applyTransformation(battleObj, battleKey, p1name, p1taggedInChar, turn);
    applyTransformation(battleObj, battleKey, p2name, p2taggedInChar, turn);
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

// create an object containing key-value pairs of characters and their new resolves
function getTeamResolvesAfterTurn(playerNumber, battleEmbed) {
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
function applyTransformation(battleObj, battleKey, playerName, charName, turn) {
    if (charName !== null && typeof battleObj[battleKey][playerName].chars[charName] === 'undefined'
     && consts.transformChars.includes(charName)) {
        switch (charName) {

            case "Serious Kōenji Rokusuke":
                battleObj[battleKey][playerName].chars[charName] = structuredClone(battleObj[battleKey][playerName].chars["Perfect Kōenji Rokusuke"]);
                battleObj[battleKey][playerName].initialCharStats[charName] = structuredClone(battleObj[battleKey][playerName].initialCharStats["Perfect Kōenji Rokusuke"]);
                addBoost(battleObj, battleKey, playerName, charName, "The Perfect Existence", turn);
                battleObj[battleKey][playerName].chars[charName].moves.splice(
                    battleObj[battleKey][playerName].chars[charName].moves.indexOf("The Perfect Existence")
                , 1);
                battleObj[battleKey][playerName].initialCharStats[charName].moves.splice(
                    battleObj[battleKey][playerName].initialCharStats[charName].moves.indexOf("The Perfect Existence")
                , 1);
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