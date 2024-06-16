// Given an image of the user's party, parse it for the characters they're using,
// calculate the stats of those characters, and update the battleObj accordingly.
import { printParty } from './prettyPrint.mjs';
import { round } from './round.mjs';
import consts from '../consts.json' assert { type: 'json' };

export async function setPlayerParty(battleObj, playerName, imageURL) {
    let battleKey = "";

    let matchingKeys = [];
    for (let key in battleObj) {
        if (key.includes(playerName) && Object.keys(battleObj[key][playerName].chars).length < 3) {
            matchingKeys.push(key)
        }
    }
    if (matchingKeys.length == 0) {
        return;
    }
    if (matchingKeys.length == 1) {
        battleKey = matchingKeys[0];
    }
    if (matchingKeys.length >= 2) {
        let normalBattleKeys = matchingKeys.filter(key => !key.includes("Chairman Sakayanagi"));
        battleKey = normalBattleKeys[0];
    }

    let party = await fetch(`http://127.0.0.1:${consts.port}/ImageData/parseParty`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            imageURL: imageURL
        })
    });
    let partyJSON = await party.json();
    for (let i = 0; i < partyJSON.length; i++) {
        let char = partyJSON[i];
        if (char?.name == "empty") {
            //console.log(`There is no character in slot ${i + 1} of ${playerName}'s party.`);
        } else if (char === null) {
            battleObj[battleKey][playerName].valid = false;
            battleObj[battleKey][playerName].reason = `character in slot ${i + 1} of ${playerName}'s party not found in image database.`;
            return;
        } else {
            let charStats = await fetch(`http://127.0.0.1:${consts.port}/CharacterData/${char.name.replace(' ', '_')}/${char.numStars}`);
            if (charStats.status == 404) {
                battleObj[battleKey][playerName].valid = false;
                battleObj[battleKey][playerName].reason = 
`${char.name} with ${char.numStars} stars in ${playerName}'s party was not found in the database.
${playerName}'s id is '${battleObj[battleKey][playerName].id}'`;
                return;
            } else {
                //console.log(`${char.name} with ${char.numStars} stars was found in the database!`);
                let charStatsJSON = await charStats.json();
                battleObj[battleKey][playerName].chars[char.name] = charStatsJSON;
                if (i <= 2) {
                    battleObj[battleKey][playerName].chars[char.name].active = true;
                } else {
                    battleObj[battleKey][playerName].chars[char.name].active = false;
                }
            }
        }
    }

    let baseStats = structuredClone(battleObj[battleKey][playerName].chars);

    let hasStrength = false;
    if (battleObj[battleKey][playerName].id != consts.botID) {
        hasStrength = true;
    }

    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        // I'm changing the way I calculate stats because I believe it is the way Rhymar actually does it
        // hopefully this eliminates the inconsistencies I was observing
        let thisCharBoosts = {
            resolve: [],
            mental: [],
            physical: [],
            social: [],
            initiative: []
        }

        for (let charKey2 in baseStats) {
            let charBoosted = false;
            let ally = baseStats[charKey2].allies[0];
            let supportCategory = baseStats[charKey2].supportCategory.toLowerCase();
            if (thisChar.tags.includes(ally)) {
                if (supportCategory == 'ability') {
                    thisCharBoosts.initiative.push(baseStats[charKey2].supportBonus / 100);
                    thisCharBoosts.mental.push(baseStats[charKey2].supportBonus / 100);
                    thisCharBoosts.physical.push(baseStats[charKey2].supportBonus / 100);
                    thisCharBoosts.social.push(baseStats[charKey2].supportBonus / 100);
                } else {
                    thisCharBoosts[supportCategory].push(baseStats[charKey2].supportBonus / 100);
                }
                charBoosted = true;
            }
            if (baseStats[charKey2].allies.length > 1 && !charBoosted) {
                ally = baseStats[charKey2].allies[1];
                if (thisChar.tags.includes(ally)) {
                    if (supportCategory == 'ability') {
                        thisCharBoosts.initiative.push(baseStats[charKey2].supportBonus / 100);
                        thisCharBoosts.mental.push(baseStats[charKey2].supportBonus / 100);
                        thisCharBoosts.physical.push(baseStats[charKey2].supportBonus / 100);
                        thisCharBoosts.social.push(baseStats[charKey2].supportBonus / 100);
                    } else {
                        thisCharBoosts[supportCategory].push(baseStats[charKey2].supportBonus / 100);
                    }
                }
            }
        }

        // code was written to see if the player is in a faction that has strength level 3,
        // but since all factions now have strength level 3, and network processes are slow,
        // I skipped actually checking and instead just automatically add 10% to all character stats,
        // unless you're going against the Chairman Sakayanagi bot
        if (hasStrength) {
            thisCharBoosts.resolve.push(0.1);
            thisCharBoosts.mental.push(0.1);
            thisCharBoosts.physical.push(0.1);
            thisCharBoosts.social.push(0.1);
            thisCharBoosts.initiative.push(0.1);
        }

        for (let statKey in thisCharBoosts) {
            for (let buffAmount of thisCharBoosts[statKey]) {
                thisChar[statKey] += baseStats[charKey][statKey] * buffAmount;
            }
            thisChar[statKey] = round(thisChar[statKey]);
        }
    }
 
    printParty(battleObj, battleKey, playerName, partyJSON, hasStrength);

    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        if (thisChar.active) {
            //boosts will keep track of things like unity, hate, and study. 
            thisChar.buffs = [];
            thisChar.debuffs = [];
            thisChar.positiveStatuses = [];
            thisChar.negativeStatuses = [];
            delete thisChar._id;
            delete thisChar.name;
            delete thisChar.active;
        } else {
            delete battleObj[battleKey][playerName].chars[charKey];
        }
    }

    //if you want to double-check that the characters' stats were calculated correctly
    //console.log(battleObj[battleKey][playerName].chars);

    for (let charKey in battleObj[battleKey][playerName].chars) {
        if (consts.excludedChars.includes(charKey)) {
            battleObj[battleKey][playerName].valid = false;
            battleObj[battleKey][playerName].reason = `${playerName} is using ${charKey}`;
            return;
        }
    }

    battleObj[battleKey][playerName].initialCharStats = structuredClone(battleObj[battleKey][playerName].chars);
    battleObj[battleKey][playerName].valid = true;
}