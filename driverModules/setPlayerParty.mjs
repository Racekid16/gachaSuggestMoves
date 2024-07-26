// Given an image of the user's party, parse it for the characters they're using,
// calculate the stats of those characters, and update the battleObj accordingly.
import fs from 'fs';
import axios from 'axios';
import crypto from 'crypto';
import sharp from 'sharp';
import { printParty } from './prettyPrint.mjs';
import { round } from './round.mjs';
import { addAspectAttributes, addAspectBoost } from './aspect.mjs';
import { applyBoosts } from './updateBoosts.mjs';
import consts from '../consts.json' assert { type: 'json' };

const delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));

//the playerName parameter of this function does not have the player number prepended to it
export async function setPlayerParty(battleObj, programSocket, playerName, playerID, imageURL, avatarURL, supportBonus) {
    let battleKey = determineBattleKey(battleObj, playerName, playerID);
    if (battleKey === false) {
        return;
    }
    
    let encodedBattleKey = battleKey.replace(/\//g, 'slash');
    let tempPartyImageName = generateRandomFileName();
    let partyFinishedDownloading = false;
    let tempPartySaveLocation = `./webpage/battleAssets/${encodedBattleKey}/${tempPartyImageName}.png`;
    downloadImage(imageURL.replace('format=png&width=328&height=254', ""), tempPartySaveLocation)
        .then(() => partyFinishedDownloading = true)
        .catch(err => console.error(`Failed to download image to ${tempPartySaveLocation}:`, err));

    let tempAvatarName = generateRandomFileName();
    let avatarFinishedDownloading = false;
    let tempAvatarSaveLocation = `./webpage/battleAssets/${encodedBattleKey}/${tempAvatarName}.png`;
    downloadImage(avatarURL.replace('?size=1024', ""), tempAvatarSaveLocation)
        .then(() => avatarFinishedDownloading = true)
        .catch(err => console.error(`Failed to download image to ${tempAvatarSaveLocation}:`, err));

    let party = await fetch(`http://127.0.0.1:${consts.port}/ImageData/parseParty`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            imageURL: imageURL
        })
    });
    let partyArray = await party.json();
    if (partyArray.message) {
        battleObj[battleKey][playerName].valid = false;
        battleObj[battleKey][playerName].reason = partyArray.message;
        return;
    }

    let splitBattleKey = battleKey.split(" vs. ");
    let p1name = splitBattleKey[0].slice(splitBattleKey[0].indexOf('1.') + 2);
    let p2name = splitBattleKey[1].slice(splitBattleKey[1].indexOf('2.') + 2);
    let playerNumber = 0;
    while (typeof battleObj[battleKey] !== 'undefined' && battleObj[battleKey]?.numPartiesRequested < 2 
        && battleObj[battleKey][`1.${p1name}`]?.valid !== false && battleObj[battleKey][`2.${p2name}`]?.valid !== false) {
        await delay(200);
    }
    if (typeof battleObj[battleKey] === 'undefined') {
        return;
    }
    if (battleObj[battleKey][`1.${p1name}`]?.valid === false || battleObj[battleKey][`2.${p2name}`]?.valid === false) {
        battleObj[battleKey][`1.${p1name}`].valid = false;
        battleObj[battleKey][`2.${p2name}`].valid = false;
        return;
    }

    let defaultAvatarCount = battleObj[battleKey].requestedParties.filter(ID => ID === null).length;
    if (defaultAvatarCount == 0) {
        playerNumber = determinePlayerNumberByID(battleObj, battleKey, playerName, playerID);
    }
    else if (defaultAvatarCount == 1) {
        let nonNullIndex = battleObj[battleKey].requestedParties.findIndex(el => el !== null);
        if (playerID == null) {
            while (typeof battleObj[battleKey].requestedParties[nonNullIndex] !== 'number') {
                await delay(200);
            }
            playerNumber = 3 - battleObj[battleKey].requestedParties[nonNullIndex];
        } else {
            playerNumber = determinePlayerNumberByID(battleObj, battleKey, playerName, playerID);
            battleObj[battleKey].requestedParties[nonNullIndex] = playerNumber;
        }
    }
    else {  //defaultAvatarCount == 2
        if (p1name == p2name) {
            battleObj[battleKey][`1.${p1name}`].valid = false;
            battleObj[battleKey][`1.${p1name}`].reason = "unable to determine whose party is whose";
            battleObj[battleKey][`2.${p2name}`].valid = false;
            battleObj[battleKey][`2.${p2name}`].reason = "unable to determine whose party is whose";
            return;
        }
        playerNumber = determinePlayerNumberByName(battleObj, battleKey, playerName);
    }

    playerName = `${playerNumber}.${playerName}`;
    playerID = battleObj[battleKey][playerName].id;

    while (!partyFinishedDownloading) {
        await delay(200);
    }
    let encodedPlayerName = playerName.replace(/\//g, 'slash');
    let partySaveLocation = `./webpage/battleAssets/${encodedBattleKey}/${encodedPlayerName}/party.png`;
    fs.renameSync(tempPartySaveLocation, partySaveLocation);

    while (!avatarFinishedDownloading) {
        await delay(200);
    }
    let avatarSaveLocation = `./webpage/battleAssets/${encodedBattleKey}/${encodedPlayerName}/avatar.png`;
    fs.renameSync(tempAvatarSaveLocation, avatarSaveLocation);

    if (playerNumber == 2) {
        while (typeof battleObj[battleKey][`1.${p1name}`].valid === 'undefined') {
            await delay(200);
        }
    }

    for (let i = 0; i < partyArray.length; i++) {
        let char = partyArray[i];
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
                battleObj[battleKey][playerName].reason = `${char.name} with ${char.numStars} stars in ${playerName}'s party was not found in the database.\n`
                                                        + `${playerName}'s id is '${battleObj[battleKey][playerName].id}'`;
                return;
            } else {
                //console.log(`${char.name} with ${char.numStars} stars was found in the database!`);
                let charStatsJSON = await charStats.json();
                addAspectAttributes(char, charStatsJSON);
                let charName = charStatsJSON.name;
                battleObj[battleKey][playerName].chars[charName] = charStatsJSON;
                
                if (i <= 2) {
                    battleObj[battleKey][playerName].chars[charName].active = true;
                    battleObj[battleKey][playerName].chars[charName].imageName = `${charName}.png`;
                    
                    let charSaveLocation = `./webpage/battleAssets/${encodedBattleKey}/${encodedPlayerName}/chars/${charName}.png`;
                    let cropOptions = {
                        left: 149 + 656 * i,
                        top: 149,
                        width: 482,
                        height: 482,
                    };
                    sharp(partySaveLocation)
                        .extract(cropOptions) // Crop the image using the specified options
                        .toFile(charSaveLocation, (err, info) => { if (err) { throw err; }});

                } else {
                    battleObj[battleKey][playerName].chars[charName].active = false;
                }
            }
        }
    }

    let initialCharStats = structuredClone(battleObj[battleKey][playerName].chars);

    let hasStrength = false;
    if (battleObj[battleKey][playerName].id != consts.botID) {
        hasStrength = true;
    }

    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        // I'm changing the way I calculate stats because I believe it is the way Rhymar actually does it
        // hopefully this eliminates the inconsistencies I was observing
        let multiplierObj = {
            resolve: 1,
            mental: 1,
            physical: 1,
            social: 1,
            initiative: 1
        }

        for (let charKey2 in initialCharStats) {
            let charBoosted = false;
            let ally = initialCharStats[charKey2].allies[0];
            let supportCategory = initialCharStats[charKey2].supportCategory.toLowerCase();
            if (thisChar.tags.includes(ally)) {
                if (supportCategory == 'ability') {
                    multiplierObj.initiative += initialCharStats[charKey2].supportBonus / 100;
                    multiplierObj.mental += initialCharStats[charKey2].supportBonus / 100;
                    multiplierObj.physical += initialCharStats[charKey2].supportBonus / 100;
                    multiplierObj.social += initialCharStats[charKey2].supportBonus / 100;
                } else if (supportCategory == 'strength') {
                    multiplierObj.mental += initialCharStats[charKey2].supportBonus / 100;
                    multiplierObj.physical += initialCharStats[charKey2].supportBonus / 100;
                    multiplierObj.social += initialCharStats[charKey2].supportBonus / 100;
                } else {
                    multiplierObj[supportCategory] += initialCharStats[charKey2].supportBonus / 100;
                }
                charBoosted = true;
            }
            if (initialCharStats[charKey2].allies.length > 1 && !charBoosted) {
                ally = initialCharStats[charKey2].allies[1];
                if (thisChar.tags.includes(ally)) {
                    if (supportCategory == 'ability') {
                        multiplierObj.initiative += initialCharStats[charKey2].supportBonus / 100;
                        multiplierObj.mental += initialCharStats[charKey2].supportBonus / 100;
                        multiplierObj.physical += initialCharStats[charKey2].supportBonus / 100;
                        multiplierObj.social += initialCharStats[charKey2].supportBonus / 100;
                    } else if (supportCategory == 'strength') {
                        multiplierObj.mental += initialCharStats[charKey2].supportBonus / 100;
                        multiplierObj.physical += initialCharStats[charKey2].supportBonus / 100;
                        multiplierObj.social += initialCharStats[charKey2].supportBonus / 100;
                    } else {
                        multiplierObj[supportCategory] += initialCharStats[charKey2].supportBonus / 100;
                    }
                }
            }
        }

        // code was written to see if the player is in a faction that has strength level 3,
        // but since all factions now have strength level 3, and network processes are slow,
        // I skipped actually checking and instead just automatically add 10% to all character stats,
        // unless you're going against the Chairman Sakayanagi bot
        // this affects base stats, but cannot be nullified or plundered
        if (hasStrength) {
            multiplierObj.resolve += 0.1;
            multiplierObj.mental += 0.1;
            multiplierObj.physical += 0.1;
            multiplierObj.social += 0.1;
            multiplierObj.initiative += 0.1;
        }

        for (let stat in multiplierObj) {
            thisChar[stat] = round(thisChar[stat] * multiplierObj[stat]);
        }
    }

    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        thisChar.maxResolve = thisChar.resolve;
        thisChar.buffs = [];
        thisChar.debuffs = [];
        thisChar.positiveStatuses = [];
        thisChar.negativeStatuses = [];
        thisChar.inflictMultiplier = 1;
        thisChar.receiveMultiplier = 1;
        thisChar.inflictModifiers = [];
        thisChar.receiveModifiers = [];
        thisChar.lockedMoves = [];
        thisChar.rune = "None";
        addAspectBoost(thisChar);
    }

    battleObj[battleKey][playerName].baseCharStats = structuredClone(battleObj[battleKey][playerName].chars);
    applyBoosts(battleObj, battleKey, playerName);
    printParty(battleObj, battleKey, playerName, partyArray, hasStrength);

    programSocket.emit('playerParty', {
        battleObj: battleObj,
        battleKey: battleKey,
        playerNumber: playerNumber,
        playerName: playerName,
        hasStrength: hasStrength,
        partyArray: partyArray,
        supportBonus: supportBonus
    });

    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        if (thisChar.active) {
            delete thisChar._id;
            delete thisChar.active;
            delete thisChar.name;
            delete battleObj[battleKey][playerName].baseCharStats[charKey]._id;
            delete battleObj[battleKey][playerName].baseCharStats[charKey].active;
        } else {
            delete battleObj[battleKey][playerName].chars[charKey];
            delete battleObj[battleKey][playerName].baseCharStats[charKey];
        }
    }

    for (let charKey in battleObj[battleKey][playerName].chars) {
        if (consts.excludedChars.includes(charKey)) {
            battleObj[battleKey][playerName].valid = false;
            battleObj[battleKey][playerName].reason = `${playerName} is using ${charKey}`;
            return;
        }
    }

    battleObj[battleKey][playerName].valid = true;
}

//playerName should not have the player number prepended to it when passed to this function
//return the battleKey that this player is a part of and update the battle's numPartiesRequested property
function determineBattleKey(battleObj, playerName, playerID) {
    let possibleReturnVals = [];
    for (let key in battleObj) {
        if (typeof battleObj[key][`1.${playerName}`] !== 'undefined' && Object.keys(battleObj[key][`1.${playerName}`].chars).length < 3) {
            possibleReturnVals.push(key);
        }
        else if (typeof battleObj[key][`2.${playerName}`] !== 'undefined' && Object.keys(battleObj[key][`2.${playerName}`].chars).length < 3) {
            possibleReturnVals.push(key);
        }
    }
    let possibleReturnValsBeforeReducing = structuredClone(possibleReturnVals);
    if (possibleReturnVals.length >= 2) {
        let botName = "2.Chairman Sakayanagi";
        possibleReturnVals = possibleReturnVals.filter((val) => {
            return battleObj[val][botName]?.id !== consts.botID;
        });
        if (possibleReturnVals.length == 0) {
            possibleReturnVals.push(possibleReturnValsBeforeReducing[0]);
        }
    }
    if (possibleReturnVals.length > 1) {
        console.log("There are multiple values in possibleReturnVals:", possibleReturnVals)
    }
    if (possibleReturnVals.length > 0) {
        let battleKey = possibleReturnVals[0];
        battleObj[battleKey].numPartiesRequested++;
        battleObj[battleKey].requestedParties.push(playerID);
        return battleKey;
    }
    console.log("Unexpectedly got here: could not determine battle Key.");
    console.log("possibleReturnVals before reducing is", possibleReturnValsBeforeReducing);
    console.log("possibleReturnVals after reducing is", possibleReturnVals);
    console.log("The battleObj's keys are", Object.keys(battleObj));
    return false;
}

function determinePlayerNumberByID(battleObj, battleKey, playerName, playerID) {
    if (battleObj[battleKey][`1.${playerName}`]?.id == playerID) {
        return 1;
    }
    else if (battleObj[battleKey][`2.${playerName}`]?.id == playerID) {
        return 2;
    }
    console.log(`Unknown player ${playerName} with ID ${playerID} in ${battleKey}`);
}

function determinePlayerNumberByName(battleObj, battleKey, playerName) {
    if (typeof battleObj[battleKey][`1.${playerName}`] !== 'undefined') {
        return 1;
    }
    if (typeof battleObj[battleKey][`2.${playerName}`] !== 'undefined') {
        return 2;
    }
    console.log(`Unknown player ${playerName} in ${battleKey}`);
}

//got this from chat GPT
function generateRandomFileName() {
    const randomBytes = crypto.randomBytes(16).toString('hex');
    return randomBytes;
}

//got this from chat GPT
async function downloadImage(url, savePath) {
    try {
        const response = await axios({
            url,
            method: 'GET',
            responseType: 'stream'
        });

        // Create a write stream to save the image
        const writer = fs.createWriteStream(savePath);

        // Pipe the response data to the file
        response.data.pipe(writer);

        // Return a promise that resolves when the stream finishes
        return new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });
    } catch (error) {
        console.error(`Error downloading image to ${savePath}: ${error.message}`);
    }
}