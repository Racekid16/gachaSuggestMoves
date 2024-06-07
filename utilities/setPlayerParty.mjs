// Given an image of the user's party, parse it for the characters they're using,
// calculate the stats of those characters, and update the battleObj accordingly.

export async function setPlayerParty(battleObj, playerName, imageURL) {
    let battleKey = "";
    for (let key in battleObj) {
        if (key.includes(playerName) && Object.keys(battleObj[key][playerName].chars).length < 3) {
            battleKey = key;
            break;
        }
    }
    if (battleKey == "") {
        return;
    }
    let party = await fetch(`http://127.0.0.1:2500/ImageData/parseParty`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            imageURL: imageURL
        })
    });
    let partyJSON = await party.json();
    console.log(`${playerName}'s party:
Active: ${partyJSON[0]?.name} ${"⭐".repeat(partyJSON[0]?.numStars)}, ${partyJSON[1]?.name} ${"⭐".repeat(partyJSON[1]?.numStars)}, ${partyJSON[2]?.name} ${"⭐".repeat(partyJSON[2]?.numStars)}
Bench:  ${partyJSON[3]?.name} ${"⭐".repeat(partyJSON[3]?.numStars)}, ${partyJSON[4]?.name} ${"⭐".repeat(partyJSON[4]?.numStars)}, ${partyJSON[5]?.name} ${"⭐".repeat(partyJSON[5]?.numStars)}`);
    for (let i = 0; i < partyJSON.length; i++) {
        let char = partyJSON[i];
        if (char?.name == "empty") {
            //console.log(`There is no character in slot ${i + 1} of ${playerName}'s party.`);
        } else if (char !== null) {
            let charStats = await fetch(`http://127.0.0.1:2500/CharacterData/${char.name.replace(' ', '_')}/${char.numStars}`);
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
        } else {
            battleObj[battleKey][playerName].valid = false;
            battleObj[battleKey][playerName].reason = `character in slot ${i + 1} of ${playerName}'s party not found in image database.`;
            return;
        }
    }

    battleObj[battleKey][playerName].baseStats = structuredClone(battleObj[battleKey][playerName].chars);
    let baseStats = battleObj[battleKey][playerName].baseStats;

    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        // I'm changing the way I calculate stats because I believe it is the way Rhymar actually does it
        // hopefully this eliminates the inconsistencies I was observing
        let thisCharBoosts = {
            resolve: 0,
            mental: 0,
            physical: 0,
            social: 0,
            initiative: 0
        }

        for (let charKey2 in baseStats) {
            let charBoosted = false;
            let ally = baseStats[charKey2].allies[0];
            let supportCategory = baseStats[charKey2].supportCategory.toLowerCase();
            if (thisChar.tags.includes(ally)) {
                if (supportCategory == 'ability') {
                    thisCharBoosts.initiative += baseStats[charKey2].supportBonus / 100;
                    thisCharBoosts.mental     += baseStats[charKey2].supportBonus / 100;
                    thisCharBoosts.physical   += baseStats[charKey2].supportBonus / 100;
                    thisCharBoosts.social     += baseStats[charKey2].supportBonus / 100;
                } else {
                    thisCharBoosts[supportCategory] += baseStats[charKey2].supportBonus / 100;
                }
                charBoosted = true;
            }
            if (baseStats[charKey2].allies.length > 1 && !charBoosted) {
                ally = baseStats[charKey2].allies[1];
                if (thisChar.tags.includes(ally)) {
                    if (supportCategory == 'ability') {
                        thisCharBoosts.initiative += baseStats[charKey2].supportBonus / 100;
                        thisCharBoosts.mental     += baseStats[charKey2].supportBonus / 100;
                        thisCharBoosts.physical   += baseStats[charKey2].supportBonus / 100;
                        thisCharBoosts.social     += baseStats[charKey2].supportBonus / 100;
                    } else {
                        thisCharBoosts[supportCategory] += baseStats[charKey2].supportBonus / 100;
                    }
                }
            }
        }

        // code was written to see if the player is in a faction that has strength level 3,
        // but since all factions now have strength level 3, and network processes are slow,
        // I skipped actually checking and instead just automatically add 10% to all character stats
        thisCharBoosts.resolve    += 0.1;
        thisCharBoosts.mental     += 0.1;
        thisCharBoosts.physical   += 0.1;
        thisCharBoosts.social     += 0.1;
        thisCharBoosts.initiative += 0.1;

        for (let statKey in thisCharBoosts) {
            thisChar[statKey] = Math.round(thisChar[statKey] + baseStats[charKey][statKey] * thisCharBoosts[statKey])
        }
    }
 
    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        if (thisChar.active) {
            //boosts will keep track of things like unity, hate, and study. 
            thisChar.boosts = [];
            delete thisChar._id;
            delete thisChar.name;
            delete thisChar.active;
        } else {
            delete battleObj[battleKey][playerName].chars[charKey];
        }
    }

    //if you want to double-check that the characters' stats were calculated correctly
    //console.log(battleObj[battleKey][playerName].chars);
    battleObj[battleKey][playerName].initialStats = structuredClone(battleObj[battleKey][playerName].chars);
    battleObj[battleKey][playerName].valid = true;
}