// Create and delete battles from the battleObj.
import fs from 'fs';
import { setPlayerParty } from './setPlayerParty.mjs';
import { parseTurnResults } from './parseTurnResults.mjs';
import { splitCharName, applyRuneOfAffinity } from './aspect.mjs';
import config from '../config.json' assert { type: 'json' };
import consts from '../consts.json' assert { type: 'json' };
const delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));

export async function createBattle(battleObj, programSocket, p1name, p2name, battleEmbed, messageLink) {
    let battleKey = p1name + " vs. " + p2name;
    let turnResults = battleEmbed.fields[2].value;
    battleObj[battleKey] = {};
    battleObj[battleKey].time = new Date().toLocaleString();
    battleObj[battleKey].data = "";
    battleObj[battleKey].numPartiesRequested = 0;
    battleObj[battleKey].requestedParties = [];
    battleObj.currentBattles.push([new Date().getTime(), 'battle', p1name, p2name, battleEmbed]);
    
    //create a new file for this battle
    let encodedBattleKey = battleKey.replace(/\//g, 'slash');
    let encodedP1name = p1name.replace(/\//g, 'slash');
    let encodedP2name = p2name.replace(/\//g, 'slash');
    fs.writeFileSync(`./currentBattles/${encodedBattleKey}.txt`, '');
    battleObj[battleKey].log = function (str) {
        this.data += str + "\n";
        fs.appendFileSync(`./currentBattles/${encodedBattleKey}.txt`, str + "\n", (err) => {if (err) { throw err; }});
    }

    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}`);
    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}/${encodedP1name}`);
    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}/${encodedP1name}/chars`);
    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}/${encodedP2name}`);
    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}/${encodedP2name}/chars`);
    
    programSocket.emit('battleStart', {
        battleKey: battleKey,
        time: battleObj[battleKey].time,
        link: messageLink
    });

    console.log(`${battleKey} started`);
    battleObj[battleKey].log(`${battleKey} started at ${battleObj[battleKey].time}`);
    battleObj[battleKey].log(`Link: ${messageLink}\n`);

    let promise1 = addPlayerToBattle(battleObj, battleKey, p1name, 1, turnResults, null);
    let promise2 = addPlayerToBattle(battleObj, battleKey, p2name, 2, turnResults, null);
    let [result1, result2] = await Promise.all([promise1, promise2]);
    if (result1 != 0 || result2 != 0) {
        deleteBattle(battleObj, programSocket, p1name, p2name, null);
        console.log(`failed to request a player's party in ${battleKey}`);
        return;
    }

    let promiseResult = await verifyBattleValidity(battleObj, programSocket, p1name, p2name);
    if (promiseResult != 0) {
        return;
    }

    verifyPlayerResolves(battleObj, programSocket, battleKey, p1name, 1, battleEmbed);
    verifyPlayerResolves(battleObj, programSocket, battleKey, p2name, 2, battleEmbed);
    
    parseTurnResults(battleObj, programSocket, p1name, p2name, battleEmbed);
}

export async function createCampaignBattle(battleObj, programSocket, playerName, playerID, botPartyImageURL, botAvatarURL, supportBonus, messageLink, stage) {
    let response = await fetchWithRetry(`https://discord.com/api/v9/guilds/${consts.serverID}/members/${playerID}`, {
        method: 'GET',
        headers: {
            authorization: config.token,
            "Content-Type": "application/json"
        }
    });
    let responseJSON = await response.json();
    if (responseJSON.nick !== null) {
        playerName = `1.${responseJSON.nick}`;
    }
    let botName = "2.Chairman Sakayanagi";
    let battleKey = playerName + " vs. " + botName;
    battleObj[battleKey] = {};
    battleObj[battleKey].time = new Date().toLocaleString();
    battleObj[battleKey].data = "";
    battleObj[battleKey].numPartiesRequested = 0;
    battleObj[battleKey].requestedParties = [];
    
    //create a new file for this battle
    let encodedBattleKey = battleKey.replace(/\//g, 'slash');
    let encodedPlayerName = playerName.replace(/\//g, 'slash');
    fs.writeFileSync(`./currentBattles/${encodedBattleKey}.txt`, '');
    battleObj[battleKey].log = function (str) {
        this.data += str + "\n";
        fs.appendFileSync(`./currentBattles/${encodedBattleKey}.txt`, str + "\n", (err) => {if (err) { throw err; }});
    }

    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}`);
    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}/${encodedPlayerName}`);
    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}/${encodedPlayerName}/chars`);
    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}/${botName}`);
    fs.mkdirSync(`./webpage/battleAssets/${encodedBattleKey}/${botName}/chars`);

    programSocket.emit('battleStart', {
        battleKey: battleKey,
        time: battleObj[battleKey].time,
        link: messageLink
    });
    
    console.log(`${battleKey} (Campaign Stage ${stage}) started`);
    battleObj[battleKey].log(`${battleKey} (Campaign Stage ${stage}) started at ${battleObj[battleKey].time}`);
    battleObj[battleKey].log(`Link: ${messageLink}\n`);

    battleObj[battleKey][botName] = {};
    battleObj[battleKey][botName].chars = {};
    battleObj[battleKey][botName].id = consts.botID;
    battleObj[battleKey][botName].previousTaggedInChar = null;
    battleObj.usernames[consts.botID] = botName;
    
    setPlayerParty(battleObj, programSocket, "Chairman Sakayanagi", consts.botID, botPartyImageURL, botAvatarURL, supportBonus);
    battleObj[battleKey][playerName] = {};
    battleObj[battleKey][playerName].chars = {};
    battleObj[battleKey][playerName].id = playerID;
    battleObj[battleKey][playerName].previousTaggedInChar = null;
    battleObj.usernames[playerID] = playerName;
}

export function deleteBattle(battleObj, programSocket, p1name, p2name, header, turnResults) {
    let battleKey = p1name + " vs. " + p2name;
    let battleEndMessage;
    let p1ID = battleObj[battleKey][p1name].id;
    let p2ID = battleObj[battleKey][p2name].id
    
    if (header === 'WINNER:') {
        let winnerID = /<@(\d+)>/.exec(turnResults)[1];
        let winner;
        let loser;

        if (p1ID == winnerID) {
            winner = p1name;
            loser = p2name;
        } else {
            winner = p2name;
            loser = p1name;
        }
        if (!turnResults.includes("forfeit by inactivity")) {
            battleEndMessage = `${winner} won against ${loser}`;
        } else {
            battleEndMessage = `${winner} won against ${loser} (forfeit by inactivity)`;
        }
        console.log(battleEndMessage);
        battleObj[battleKey].log(battleEndMessage);
        
        fetch(`http://127.0.0.1:${consts.port}/BattleLogs/updateDb`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                players: [p1ID, p2ID],
                time: battleObj[battleKey].time,
                data: battleObj[battleKey].data
            })
        });
    } 
    else if (header === 'RESULT: DRAW') {
        battleEndMessage = `${p1name} and ${p2name} drew`;
    } else {
        battleEndMessage = `${battleKey} deleted`;
        console.log(battleEndMessage);
    }
    let encodedBattleKey = battleKey.replace(/\//g, 'slash');
    fs.unlink(`./currentBattles/${encodedBattleKey}.txt`, (err) => {if (err) { throw err; }});
    battleObj.currentBattles.splice(battleObj.currentBattles.findIndex((arr) => {
        arr[2] == p1name && arr[3] == p2name
    }));
    
    let battleAssetsPath = `./webpage/battleAssets/${encodedBattleKey}`;
    if (fs.existsSync(battleAssetsPath)) {
        fs.rm(battleAssetsPath, { recursive: true }, (err) => { if (err) { throw err; } });
    }

    programSocket.emit('battleEnd', {
        battleKey: battleKey,
        header: header,
        turnResults: turnResults,
        battleEndMessage: battleEndMessage,
        usernames: battleObj.usernames
    });

    delete battleObj[battleKey];
    
}

// check whether the actual resolves of characters in a player's party match what was calculated
export function verifyPlayerResolves(battleObj, programSocket, battleKey, playerName, playerNumber, battleEmbed) {
    let resolveRegex = / (\*__(.+)__\*\*\*|\*(.+)\*) - \*\*(\d+)\*\*:heart:/g;

    while (true) {
        let resolveMatch = resolveRegex.exec(battleEmbed.fields[playerNumber - 1].value);
        if (resolveMatch === null) {
            break;
        }
        let charName = "";
        if (typeof resolveMatch[2] !== 'undefined') {
            charName = resolveMatch[2];
        } else {    //typeof resolveMatch[3] !== 'undefined'
            charName = resolveMatch[3];
        }

        if (typeof battleObj[battleKey][playerName].chars[charName] === 'undefined') {
            let [aspect, charNameNoAspect] = splitCharName(charName);
            if (typeof battleObj[battleKey][playerName].chars[charNameNoAspect] !== 'undefined') {
                applyRuneOfAffinity(battleObj, battleKey, playerName, charName);     
            // This sometimes happens; not entirely sure why. Need to look into it more.
            } else {
                console.log(`${charName} is undefined in ${playerName}'s party`);
                console.log(`The player's character resolves are:`);
                console.log(battleEmbed.fields[0].value);
                console.log(`battleObj[${battleKey}][${playerName}] is:`);
                console.log(battleObj[battleKey][playerName]);
                let [p1name, p2name] = battleKey.split(" vs. ");
                deleteBattle(battleObj, programSocket, p1name, p2name, null);
                return;
            }
        }

        let charResolve = parseInt(resolveMatch[4]);
        if (battleObj[battleKey][playerName].chars[charName].resolve != charResolve) {
            console.log(`The resolve of ${playerName}'s ${charName} in ${battleKey} was calculated to be ${battleObj[battleKey][playerName].chars[charName].resolve} but it was actually ${charResolve}`);
        }

        battleObj[battleKey][playerName].chars[charName].resolve = charResolve;
        battleObj[battleKey][playerName].baseCharStats[charName].resolve = charResolve;
    }
}

export async function requestPlayerPartyCampaignBattle(battleObj, programSocket, battleKey, playerName, playerID) {
    let botName = "2.Chairman Sakayanagi";
    battleObj.currentBattles.push([new Date().getTime(), 'campaign', playerName, botName, playerID]);
    let myResult = await addPlayerToBattle(battleObj, battleKey, playerName, 1, null, playerID);
    if (myResult != 0) { 
        deleteBattle(battleObj, programSocket, playerName, botName, null);
        console.log(`failed to request ${playerName}'s party in ${battleKey}`);
        return;
    }
    
    let promiseResult = await verifyBattleValidity(battleObj, programSocket, playerName, botName);
    if (promiseResult != 0) {
        return;
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

    battleObj.usernames[battleObj[battleKey][playerName].id] = playerName;

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
        battleObj[battleKey][playerName].valid = false;
        battleObj[battleKey][playerName].reason = `Failed to request ${playerName}'s party`
        return -1;
    }

    return 0;
}

// if it fails to request someone's party, retry the specified number of times with the specified wait timein between.
async function fetchWithRetry(url, options, retries=2) {
    let response;
    for (let attempt = 0; attempt <= retries; attempt++) {
        response = await fetch(url, options);
        if (response.status >= 200 && response.status <= 299) {
            return response;
        }
        if (attempt < retries) {
            let waitTime = 1;
            if (response.status == 429) {
                let responseJSON = await response.json();
                waitTime = responseJSON.retry_after;
            }
            console.log(`Attempt ${attempt + 1} failed with status ${response.status}: ${response.statusText}. Retrying in ${waitTime} seconds...`);
            await delay(waitTime * 1000);
        }
    }
    return response;
}

// verify that all characters in both player's parties are ones the script is prepared to deal with,
// and if not, delete the battle
async function verifyBattleValidity(battleObj, programSocket, p1name, p2name) { 
    let battleKey = p1name + " vs. " + p2name;

    while (typeof battleObj[battleKey][p1name].valid === 'undefined' || typeof battleObj[battleKey][p2name].valid === 'undefined') {
        await delay(200);
    }

    if (battleObj[battleKey][p1name].valid === false || battleObj[battleKey][p2name].valid === false) {
        if (typeof battleObj[battleKey][p1name].reason !== 'undefined') {
            console.log(`${battleObj[battleKey][p1name].reason}`);
        } else {
            console.log(`${battleObj[battleKey][p2name].reason}`);
        }
        deleteBattle(battleObj, programSocket, p1name, p2name, null);
        return -1;
    }

    return 0;
}