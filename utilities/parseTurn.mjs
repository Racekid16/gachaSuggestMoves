import { addBoost, checkBoostsExpired } from "./updateBoosts.mjs";
import { suggestMove } from "./suggestMove.mjs";

let excludedChars = [
    "Perfect Kōenji Rokusuke",
    "Serious Kōenji Rokusuke",
    "True Kushida Kikyō",
    "Unmasked Kushida Kikyō",
    "Pawn"
];

export function parseTurn(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    let turnResults = battleEmbed.fields[2].value;
    //TODO: comment this
    console.log(`Turn ${turn} of ${battleKey}:\n${turnResults.replaceAll(/\*/g, '')}\n`);

    //determine what characters each player used
    let currentCharRegex = /__(.+)__/;
    let p1char = currentCharRegex.exec(battleEmbed.fields[0].value)?.[1];
    let p2char = currentCharRegex.exec(battleEmbed.fields[1].value)?.[1];

    let p1Resolves = getTeamResolves(1, battleEmbed);
    let p2Resolves = getTeamResolves(2, battleEmbed);
    //TODO: remove this
    console.log('p1Resolves:', p1Resolves);
    console.log('p2Resolves:', p2Resolves);

    //determine the new resolves 
    if (typeof p1char === 'undefined' || typeof p2char === 'undefined') {
        parseTurnDefeatedChar();
        return;
    }
    else if (excludedChars.includes(p1char) || excludedChars.includes(p2char)) {
        return;
    }
    else if (p1char == p2char) {
        parseTurnSameChar();      
    }
    else {
        parseTurnDifferentChars();
    }
    checkBoostsExpired(battleObj, battleKey, p1name, turn);
    checkBoostsExpired(battleObj, battleKey, p2name, turn);
    suggestMove();
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

function parseTurnDefeatedChar() {

}

function parseTurnSameChar() {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
}

function parseTurnDifferentChars() {

}