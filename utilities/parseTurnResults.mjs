import { addBoost, addBoostToAliveTeammates, removeExpiredBoosts } from "./updateBoosts.mjs";
import { suggestMoves } from "./suggestMove.mjs";
import consts from '../consts.json' assert { type: 'json' };

// decrypt the turn results to determine if non-resolve affecting moves were used,
// then update the stats accordingly by calling the functions from updateBoosts
export function parseTurnResults(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    let turnResults = battleEmbed.fields[2].value;

    //remove the .replace part if you're testing
    console.log(`Turn ${turn} of ${p1name} vs. ${p2name}:\n${turnResults}`);

    //determine player resolves
    let p1resolves = getTeamResolves(1, battleEmbed);
    let p2resolves = getTeamResolves(2, battleEmbed);

    //determine what characters each player used this turn
    let p1char = getPlayerCharacter(battleObj, battleKey, p1name, 1, battleEmbed);
    let p2char = getPlayerCharacter(battleObj, battleKey, p2name, 2, battleEmbed);

    if (p1char == p2char) {
        parseMoveSameChar(battleObj, p1name, p2name, p1char, turnResults, p1resolves, p2resolves);      
    } else {
        parseMoveDifferentChars(battleObj, battleKey, p1name, p2name, p1char, p2char, turnResults, turn);
        parseMoveDifferentChars(battleObj, battleKey, p2name, p1name, p2char, p1char, turnResults, turn);
    }

    updateResolves(battleObj, battleKey, p1name, p1resolves);
    updateResolves(battleObj, battleKey, p2name, p2resolves);
    removeExpiredBoosts(battleObj, battleKey, p1name, turn);
    removeExpiredBoosts(battleObj, battleKey, p2name, turn);

    let p1taggedInChar = battleObj[battleKey][p1name].taggedInChar;
    let p2taggedInChar = battleObj[battleKey][p2name].taggedInChar;
    if (p1taggedInChar !== null && p2taggedInChar !== null) {
        console.log("");
        suggestMoves(battleObj, p1name, p2name, p1taggedInChar, p2taggedInChar, turn);
        console.log("");
    }

    battleObj[battleKey][p1name].previousTaggedInChar = p1taggedInChar;
    battleObj[battleKey][p2name].previousTaggedInChar = p2taggedInChar;
    
}

// determine what character the player is using (or used if they died)
// and set the player's taggedInChar property
function getPlayerCharacter(battleObj, battleKey, playerName, playerNumber, battleEmbed) {
    if (consts.transformChars.includes(battleObj[battleKey][playerName].previousTaggedInChar)) {
        // TODO
    }    

    let taggedInCharRegex = /__(.+)__/;
    let charName = taggedInCharRegex.exec(battleEmbed.fields[playerNumber - 1].value)?.[1];

    // if the player's character was defeated, set their char equal to their previous turn's char
    if (typeof charName === 'undefined') {
        charName = battleObj[battleKey][playerName].previousTaggedInChar;
        battleObj[battleKey][playerName].taggedInChar = null;
    } else {
        battleObj[battleKey][playerName].taggedInChar = charName;
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
function parseMoveSameChar(battleObj, p1name, p2name, charName, turnResults, p1resolves, p2resolves) {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
}

// determine whether the characters used a move that affects non-resolve stats, 
// where both players used a different character
function parseMoveDifferentChars(battleObj, battleKey, attacker, defender, attackChar, defenseChar, turnResults, turn) {
    let attackerID = battleObj[battleKey][attacker].id;
    let previousTaggedInChar = battleObj[battleKey][attacker].previousTaggedInChar;

    if (turnResults.includes(`**${attackChar}** used **Arrogance**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Arrogance", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Blazing Form**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Blazing Form", turn);
    }

    if (previousTaggedInChar !== null && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Boss Orders") 
     && battleObj[battleKey][attacker].chars[previousTaggedInChar].resolve == 0) {
        addBoostToAliveTeammates(battleObj, battleKey, attacker, "Boss Orders", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Hate**!\n**${defenseChar}**'s **Ability** was weakened!`)) {
        addBoost(battleObj, battleKey, defender, defenseChar, "Hate", turn);
    }

    //TODO
    // Humiliate

    //TODO
    // Introversion

    if (turnResults.includes(`**${attackChar}** used **Kings Command**!\n**${attackChar}** summoned a **Pawn**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Kings Command", turn);
    }

    if (turnResults.includes(`**<@${attackerID}>** tagged in **${attackChar}**!`) && previousTaggedInChar !== null 
     && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Lead By Example")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Lead By Example", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Study**!\n**${attackChar}**'s **Mental** was greatly boosted!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Study", turn);
    }

    //TODO: account for the other attribute of perfect existence here-
    //or maybe do it in the transformChar function instead
    if (turnResults.includes(`**<@${attackerID}>** tagged in **${attackChar}**!`) 
     && battleObj[battleKey][attacker].chars[attackChar].moves.includes("The Perfect Existence")) {
        battleObj[battleKey][playerName].char[charName].debuffs = [];
    }

    if (turnResults.includes(`**${attackChar}** used **Unity**!`)
     && turnResults.includes(`**${attackChar}**'s **Ability** was boosted!`)) {
        addBoostToAliveTeammates(battleObj, battleKey, attacker, "Unity", turn);
    }
    
}

function updateResolves(battleObj, battleKey, playerName, playerResolves) {
    for (let charKey in playerResolves) {
        battleObj[battleKey][playerName].chars[charKey].resolve = playerResolves[charKey];
    }
}