// Create and delete battles from the battleObj.
import { setPlayerParty } from './setPlayerParty.mjs';
import config from '../config.json' assert { type: 'json' };
import consts from '../consts.json' assert { type: 'json' };
import { parseTurnResults } from './parseTurnResults.mjs';
const delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));

export async function createBattle(battleObj, p1name, p2name, battleEmbed) {
    console.log(`${p1name} vs. ${p2name} started`);
    let battleKey = p1name + "_vs._" + p2name;
    let turnResults = battleEmbed.fields[2].value;
    battleObj[battleKey] = {};

    let promise1 = addPlayerToBattle(battleObj, battleKey, p1name, 1, turnResults, null);
    let promise2 = addPlayerToBattle(battleObj, battleKey, p2name, 2, turnResults, null);
    let [result1, result2] = await Promise.all([promise1, promise2]);
    if (result1 == -1 || result2 == -1) {
        deleteBattle(battleObj, p1name, p2name, null);
        console.log(`${p1name} vs. ${p2name} was deleted; failed to request a player's party\n`);
        return;
    }

    let validPromise = verifyBattleValidity(battleObj, p1name, p2name);
    let promiseResult = await validPromise;
    if (promiseResult == -1) {
        return;
    }

    verifyPlayerResolves(battleObj, battleKey, p1name, 1, battleEmbed);
    verifyPlayerResolves(battleObj, battleKey, p2name, 2, battleEmbed);

    parseTurnResults(battleObj, p1name, p2name, battleEmbed);
}

export async function createCampaignBattle(battleObj, playerName, playerID, botPartyImageURL, stage) {
    console.log(`${playerName} vs. Chairman Sakayanagi (Campaign Stage ${stage}) started`);
    let battleKey = playerName + "_vs._Chairman Sakayanagi";
    battleObj[battleKey] = {};

    let myPromise = addPlayerToBattle(battleObj, battleKey, playerName, 1, null, playerID);
    let myResult = await myPromise;
    if (myResult == -1) { 
        deleteBattle(battleObj, playerName, 'Chairman Sakayanagi', null);
        console.log(`${playerName} vs. Chairman Sakayanagi was deleted; failed to request ${playerName}'s party\n`);
        return;
    }

    battleObj[battleKey]['Chairman Sakayanagi'] = {};
    battleObj[battleKey]['Chairman Sakayanagi'].chars = {};
    battleObj[battleKey]['Chairman Sakayanagi'].id = consts.botID;
    battleObj[battleKey]['Chairman Sakayanagi'].previousTaggedInChar = null;
    setPlayerParty(battleObj, 'Chairman Sakayanagi', botPartyImageURL);

    let validPromise = verifyBattleValidity(battleObj, playerName, 'Chairman Sakayanagi');
    let promiseResult = await validPromise;
    if (promiseResult == -1) {
        return;
    }
}

export function deleteBattle(battleObj, p1name, p2name, turnResults) {
    let battleKey = p1name + "_vs._" + p2name;
    
    if (turnResults !== null) {
        let winnerID = /<@(\d+)>/.exec(turnResults)[1];
        let winner;
        let loser;

        if (battleObj[battleKey][p1name].id == winnerID) {
            winner = p1name;
            loser = p2name;
        } else {
            winner = p2name;
            loser = p1name;
        }
        if (!turnResults.includes("forfeit by inactivity")) {
            console.log(`${winner} won against ${loser}\n`)
        } else {
            console.log(`${winner} won against ${loser} (forfeit by inactivity)\n`);
        }
    }

    delete battleObj[battleKey];
}

// check whether the actual resolves of characters in a player's party match what was calculated
export function verifyPlayerResolves(battleObj, battleKey, playerName, playerNumber, battleEmbed) {
    let resolveRegex = / (\*__(.+)__\*\*\*|\*(.+)\*) - \*\*(\d+)\*\*:heart:/g;

    for (let i = 0; i < 3; i++) {
        let resolveMatch = resolveRegex.exec(battleEmbed.fields[playerNumber - 1].value);
        let charName = "";
        if (typeof resolveMatch[2] !== 'undefined') {
            charName = resolveMatch[2];
        } else {    //typeof resolveMatch[3] !== 'undefined'
            charName = resolveMatch[3];
        }

        //DEBUG
        if (typeof battleObj[battleKey][playerName].chars[charName] === 'undefined') {
            console.log(`${charName} is undefined in ${playerName}'s party`);
            console.log(battleEmbed.fields[0].value);
            console.log(battleObj[battleKey][playerName]);
        }

        let charResolve = parseInt(resolveMatch[4]);
        if (battleObj[battleKey][playerName].chars[charName].resolve != charResolve) {
            console.log(`${charName}'s resolve was calculated to be ${battleObj[battleKey][playerName].chars[charName].resolve} but it was actually ${charResolve}\n`);
        }

        battleObj[battleKey][playerName].chars[charName].resolve = charResolve;
        battleObj[battleKey][playerName].initialCharStats[charName].resolve = charResolve;
    }
}

// add an object representing a player to their battle, and request the player's party
async function addPlayerToBattle(battleObj, battleKey, playerName, playerNumber, turnResults, playerID) {
    battleObj[battleKey][playerName] = {};
    battleObj[battleKey][playerName].chars = {};
    battleObj[battleKey][playerName].previousTaggedInChar = null;

    if (turnResults !== null) {
        if (playerNumber == 1) {
            battleObj[battleKey][playerName].id = turnResults.substring(turnResults.indexOf('**<@') + 4, turnResults.indexOf('>**'));
        } else {
            battleObj[battleKey][playerName].id = turnResults.substring(turnResults.indexOf('\n**<@') + 5, turnResults.lastIndexOf('>**'));
        }
    } else {
        battleObj[battleKey][playerName].id = playerID;
    }

    let payload = `{"type":2,"application_id":"1101145170466062416","guild_id":"870355988887265301","channel_id":${config.privateThread},"session_id":"5da606d879de77e2287e7d26d2ddb04d","data":{"version":"1109844232824426714","id":"1109844232665059379","guild_id":"870355988887265301","name":"party","type":1,"options":[{"type":6,"name":"member","value":${battleObj[battleKey][playerName].id}}],"application_command":{"id":"1109844232665059379","application_id":"1101145170466062416","version":"1109844232824426714","default_member_permissions":null,"type":1,"nsfw":false,"name":"party","description":"View/Edit your active party!","guild_id":"870355988887265301","options":[{"type":6,"name":"member","description":"…"}]},"attachments":[]}}`;
    let response = await fetchWithRetry('https://discord.com/api/v9/interactions', {
        method: 'POST',
        headers: {
            authorization: config.token,
            "Content-Type": "application/json"
        }, 
        body: payload
    });
    if (response.status != 204) {
        console.log(`Status ${response.status}: ${response.statusText}`);
        return -1;
    }

    return 0;
}

// if it fails to request someone's party, retry the specified number of times with the specified wait timein between.
async function fetchWithRetry(url, options, retries = 1, waitTime = 2000) {
    let response;
    for (let attempt = 0; attempt <= retries; attempt++) {
        response = await fetch(url, options);
        if (response.status === 204) {
            return response;
        }
        if (attempt < retries) {
            console.log(`Attempt ${attempt + 1} failed with status ${response.status}: ${response.statusText}. Retrying in ${delay / 1000} seconds...`);
            await waitTime(delay);
        }
    }
    return response;
}

// verify that all characters in both player's parties are ones the script is prepared to deal with,
// and if not, delete the battle
async function verifyBattleValidity(battleObj, p1name, p2name) { 
    let battleKey = p1name + "_vs._" + p2name;

    while (typeof battleObj[battleKey][p1name].valid === 'undefined' || typeof battleObj[battleKey][p2name].valid === 'undefined') {
        await delay(1);
    }

    if (!battleObj[battleKey][p1name].valid || !battleObj[battleKey][p2name].valid) {
        if (!battleObj[battleKey][p1name].valid) {
            console.log(`${p1name} vs. ${p2name} was deleted because ${battleObj[battleKey][p1name].reason}\n`);
        } else {
            console.log(`${p1name} vs. ${p2name} was deleted because ${battleObj[battleKey][p2name].reason}\n`);
        }
        deleteBattle(battleObj, p1name, p2name, null);
        return -1;
    }

    delete battleObj[battleKey][p1name].valid;
    delete battleObj[battleKey][p2name].valid;
    return 0;
}