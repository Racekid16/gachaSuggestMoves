import { addBoost, checkBoostsExpired } from "./updateBoosts.mjs";
import { suggestMove } from "./suggestMove.mjs";

// decrypt the turn results to determine if non-resolve affecting moves were used,
// then update the stats accordingly by calling the functions from updateBoosts
export function parseTurnResults(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    let turnResults = battleEmbed.fields[2].value;

    //TODO: remove this
    console.log(`Turn ${turn} of ${p1name} vs. ${p2name}:\n${turnResults}\n`);

    //determine player resolves
    let p1Resolves = getTeamResolves(1, battleEmbed);
    let p2Resolves = getTeamResolves(2, battleEmbed);

    //determine what characters each player used
    let p1char = getPlayerCharacter(battleObj, battleKey, p1name, 1, battleEmbed);
    let p2char = getPlayerCharacter(battleObj, battleKey, p2name, 2, battleEmbed);

    if (p1char == p2char) {
        parseMoveSameChar(battleObj, p1name, p2name, p1char, turnResults, p1Resolves, p2Resolves);      
    } else {
        parseMoveDifferentChars(battleObj, p1name, p2name, p1char, p2char, turnResults);
        parseMoveDifferentChars(battleObj, p2name, p1name, p2char, p1char, turnResults);
    }

    checkBoostsExpired(battleObj, battleKey, p1name, turn);
    checkBoostsExpired(battleObj, battleKey, p2name, turn);
    updateResolves(battleObj, battleKey, p1name, p1Resolves);
    updateResolves(battleObj, battleKey, p2name, p2Resolves);

    let p1currentChar = battleObj[battleKey][p1name].currentChar;
    let p2currentChar = battleObj[battleKey][p2name].currentChar;
    if (p1currentChar !== null && p2currentChar !== null) {
        let p1Initiative = suggestMove(battleObj, battleKey, p1name, p2name, p1currentChar, p2currentChar, turn);
        let p2Initiative = suggestMove(battleObj, battleKey, p2name, p1name, p2currentChar, p1currentChar, turn);
        if (p1Initiative > p2Initiative) {
            console.log(`${p1name}'s ${p1currentChar} will move first (${p1Initiative} > ${p2Initiative})`);
        } else if (p2Initiative > p1Initiative) {
            console.log(`${p2name}'s ${p2currentChar} will move first (${p2Initiative} > ${p1Initiative})`);
        } else {    //p1Initiative == p2Initiative
            console.log(`Both characters have the same initiative (${p1Initiative} == ${p2Initiative})`);
        }
        console.log("");
    }
    
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
function parseMoveSameChar(battleObj, p1name, p2name, charName, turnResults, p1Resolves, p2Resolves) {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
}

// determine whether the characters used a move that affects non-resolve stats, 
// where both players used a different character
function parseMoveDifferentChars(battleObj, attacker, defender, attackChar, defenseChar, turnResults) {
    
}

function updateResolves(battleObj, battleKey, playerName, playerResolves) {
    for (let charKey in playerResolves) {
        battleObj[battleKey][playerName].chars[charKey].resolve = playerResolves[charKey];
    }
}