import { addBoost, addBoostToAliveTeammates, removeExpiredBoosts } from "./updateBoosts.mjs";
import { suggestMoves } from "./suggestMove.mjs";
import consts from '../consts.json' assert { type: 'json' };

// decrypt the turn results to determine if non-resolve affecting moves were used,
// then update the stats accordingly by calling the functions from updateBoosts
export function parseTurnResults(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    let turnResults = battleEmbed.fields[2].value;

    //TODO: remove this
    //console.log(`${p1name}'s previous tagged-in character was ${battleObj[battleKey][p1name].previousTaggedInChar}`);
    //console.log(`${p2name}'s previous tagged-in character was ${battleObj[battleKey][p2name].previousTaggedInChar}`);

    //remove the .replace part if you're testing
    console.log(`Turn ${turn} of ${p1name} vs. ${p2name}:\n${turnResults}`);

    //determine player resolves
    let p1resolves = getTeamResolves(1, battleEmbed);
    let p2resolves = getTeamResolves(2, battleEmbed);

    //determine what characters each player used this turn
    let p1char = battleObj[battleKey][p1name].previousTaggedInChar;
    let p2char = battleObj[battleKey][p2name].previousTaggedInChar;

   if (p1char == p2char) {
        parseMoveSameChar(battleObj, p1name, p2name, p1char, turnResults, p1resolves, p2resolves);      
    } else {
        parseMoveDifferentChars(battleObj, battleKey, p1name, p2name, p1char, p2char, turnResults, turn, p1resolves);
        parseMoveDifferentChars(battleObj, battleKey, p2name, p1name, p2char, p1char, turnResults, turn, p2resolves);
    }

    let p1taggedInChar = getPlayerCharacter(1, battleEmbed);
    let p2taggedInChar = getPlayerCharacter(2, battleEmbed);

    //TODO: remove this
    //console.log(`${p1name}'s current tagged-in char is ${p1taggedInChar}`);
    //console.log(`${p2name}'s current tagged-in char is ${p2taggedInChar}`);

    applyTransformation(battleObj, battleKey, p1name, p1taggedInChar);
    applyTransformation(battleObj, battleKey, p2name, p2taggedInChar);

    updateResolves(battleObj, battleKey, p1name, p1resolves);
    updateResolves(battleObj, battleKey, p2name, p2resolves);
    removeExpiredBoosts(battleObj, battleKey, p1name, turn);
    removeExpiredBoosts(battleObj, battleKey, p2name, turn);

    console.log("");
    if (p1taggedInChar !== null && p2taggedInChar !== null) {
        suggestMoves(battleObj, p1name, p2name, p1taggedInChar, p2taggedInChar, turn);
        console.log("");
    }

    battleObj[battleKey][p1name].previousTaggedInChar = p1taggedInChar;
    battleObj[battleKey][p2name].previousTaggedInChar = p2taggedInChar;
}

// determine what character the player is used for this turn
// and set the player's taggedInChar property
function getPlayerCharacter(playerNumber, battleEmbed) {
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

    if (turnResults.includes(`**${attackChar}** used **Hate**!`)) {
        let hasHateDebuff = battleObj[battleKey][defender].chars[defenseChar].debuffs.reduce((accumulator, currentDebuff) => {
            return accumulator || currentDebuff.name == 'Hate';
        }, false);
        if (!hasHateDebuff) {
            addBoost(battleObj, battleKey, defender, defenseChar, "Hate", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Humiliate**!`)) {
        addBoost(battleObj, battleKey, defender, defenseChar, "Humiliate", turn);
    }

    if (turnResults.includes(`**${attackChar}** is preparing **Introversion**...`)) {
        let [lowestResolveTeammateName, lowestResolveTeammate] = 
            Object.entries(battleObj[battleKey][attacker].chars).reduce((minEntry, currentEntry) => {
                return (currentEntry[1].resolve < minEntry[1].resolve && currentEntry[1].resolve > 0) ? currentEntry : minEntry;
            });

        if (attackerResolves[lowestResolveTeammateName] != 0) {
            console.log(`This program expected ${lowestResolveTeammateName} to die, but they didn't.`);
        }

        for (let buff of lowestResolveTeammate.buffs) {
            addBoost(battleObj, battleKey, attacker, attackChar, buff.name, turn);
        }

        if (turnResults.includes(`**${attackChar}** countered with **Introversion**!`)) {
            addBoost(battleObj, battleKey, attacker, attackChar, "Introversion", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Kings Command**!\n**${attackChar}** summoned a **Pawn**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Kings Command", turn);
    }

    if (turnResults.includes(`**<@${attackerID}>** tagged in **${attackChar}**!`) && previousTaggedInChar !== null 
     && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Lead By Example")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Lead By Example", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Study**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Study", turn);
    }

    if (turnResults.includes(`**<@${attackerID}>** tagged in **${attackChar}**!`) 
     && battleObj[battleKey][attacker].chars[attackChar].moves.includes("The Perfect Existence")) {
        battleObj[battleKey][playerName].char[charName].debuffs = [];
    }

    if (turnResults.includes(`On the brink of defeat, **${attackChar}** hung on!`)
     && battleObj[battleKey][attacker].chars[attackChar].moves.includess("The Perfect Existence")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "The Perfect Existence", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Unity**!`)) {
        let hasUnityBuff = battleObj[battleKey][attacker].chars[attackChar].buffs.reduce((accumulator, currentBuff) => {
            return accumulator || currentBuff.name == 'Unity';
        }, false);
        if (!hasUnityBuff) {
            addBoostToAliveTeammates(battleObj, battleKey, attacker, "Unity", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}**'s **Initiative** was boosted!`)
     && battleObj[battleKey][attacker].chars[attackChar].moves.includes("Zenith Pace")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Zenith Pace", turn);
    }
    
}

function updateResolves(battleObj, battleKey, playerName, playerResolves) {
    for (let charKey in playerResolves) {
        battleObj[battleKey][playerName].chars[charKey].resolve = playerResolves[charKey];
    }
}