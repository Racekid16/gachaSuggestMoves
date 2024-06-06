//run this with $ node 2.logBattleData.mjs

import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import fetch from 'node-fetch';

const options = {
    WebSocket: WS, // custom WebSocket constructor
    connectionTimeout: 10000,
    maxRetries: 20,
};

async function getToken() {
    let response = await fetch("http://127.0.0.1:2500/getToken");
    let responseJSON = await response.json();
    return responseJSON.token;
}

const token = await getToken();
let interactionRequestUrl = `https://discord.com/api/v9/interactions`;
let serverId = '870355988887265301';
let privateThread = '1246780898779857010';

const delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));

function startWsConnection() {
    //make sure server is running
    fetch("http://127.0.0.1:2500");
    let socket = new ReconnectingWebSocket('wss://gateway.discord.gg/?v=9&encoding=json', [], options);
    let seqNum
    let interval;
    let connected = false;

    //make initial websocket connection
    socket.addEventListener('open', () => {
        console.log(`Connected to Discord gateway at ${new Date().toLocaleString()}\n`);
        socket.send(JSON.stringify({
            op: 2,
            d: {
                token: token,
                intents: 64002,
                properties: {
                    $os: 'linux',
                    $browser: 'my_library',
                    $device: 'my_library'
                }
            }
        }));
    });

    //handle recieving data
    socket.addEventListener('message', (response) => {
        const responseJSON = JSON.parse(response.data);
        const opcode = responseJSON.op;
        switch (opcode) {
            case 0:
                if ((responseJSON.t == 'MESSAGE_CREATE' || responseJSON.t == 'MESSAGE_UPDATE') && responseJSON.d.author?.id == '1101145170466062416' 
                && responseJSON.d.embeds.length != 0 && responseJSON.d.embeds[0].title.substring(0, 6) == "BATTLE" 
                && responseJSON.d.embeds[0].fields.length == 3) {
                    processData(responseJSON.d.embeds[0], responseJSON.d?.interaction?.name);
                } else if (responseJSON.t == 'MESSAGE_UPDATE' && responseJSON.d.author?.id == '1101145170466062416' && responseJSON.d.embeds.length > 0
                && responseJSON.d.channel_id == privateThread && /.+'s Party/.test(responseJSON.d.embeds[0]?.author?.name)) {
                    let playerName = /(.+)'s Party/.exec(responseJSON.d.embeds[0]?.author.name)[1];
                    let imageURL = responseJSON.d.embeds[0].image.proxy_url;
                    let modifiedURL = imageURL + 'format=png&width=328&height=254';
                    let time = new Date().toLocaleString(); //responseJSON.d.timestamp.replace('T', ' ').substring(0, responseJSON.d.timestamp.indexOf("."))
                    setPlayerParty(playerName, modifiedURL, time);
                }
                break;
            case 1:
                socket.send(JSON.stringify({
                    op: 1,
                    d: {
                        token: token,
                        intents: 64002,
                        properties: {
                            $os: 'linux',
                            $browser: 'my_library',
                            $device: 'my_library'
                        }
                    }
                }));
                break;
            case 10:
                interval = responseJSON.d.heartbeat_interval - 2000;
                connected = true;
                break;
            default:
        }
        seqNum = responseJSON.s;
    });

    socket.addEventListener('close', (evt) => {
        console.log(`Socket closed with code ${evt.code} at ${new Date().toLocaleString()}. Reconnecting...`);
    });

    //send heartbeat periodically to maintain connection
    (async () => {
        try {
            while (!connected) {
                await delay(500);
            }
            //console.log("interval is", interval);
            setInterval(() => {
                socket.send(JSON.stringify({
                    op: 1,
                    d: seqNum
                }));
            }, interval);
            //console.log("ping sent. interval", interval);
        } catch (err) {
            console.log(err);
        }
    })();
}

let currentBattles = {};

async function processData(battleEmbed, type) {
    let p1name = battleEmbed.fields[0].name;
    let p2name = battleEmbed.fields[1].name;
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    if (typeof currentBattles[battleKey] === 'undefined' && turn == 1) {
        if (battleKey.includes('Chairman Sakayanagi')) {
            console.log(`${p1name} vs. ${p2name} is not being logged because Chairman Sakayanagi is one of the players\n`);
            return;
        }
        console.log(`${p1name} vs. ${p2name} started`);
        createBattle(p1name, p2name, battleEmbed, type);
        return;
    } 
    if (typeof currentBattles[battleKey] === 'undefined') {
        return;
    }
    if (battleEmbed.fields[2].name == 'WINNER:') {
        deleteBattle(p1name, p2name, battleEmbed);
        return;
    }
    suggestMoves(p1name, p2name, battleEmbed);
}

async function createBattle(p1name, p2name, battleEmbed, type) {
    let battleKey = p1name + "_vs._" + p2name;
    let turnResults = battleEmbed.fields[2].value;
    currentBattles[battleKey] = {};
    currentBattles[battleKey][p1name] = {};
    currentBattles[battleKey][p1name].chars = {};
    currentBattles[battleKey][p1name].id = turnResults.substring(turnResults.indexOf('**<@') + 4, turnResults.indexOf('>**'));
    if (typeof type === 'undefined') {
        currentBattles[battleKey].type = 'gauntlet';
    } else {
        currentBattles[battleKey].type = type;
    }
    currentBattles[battleKey].data = "";
    currentBattles[battleKey].log = function (str) {
        this.data += str + "\n";
        console.log(str);
    }
    let payload = `{"type":2,"application_id":"1101145170466062416","guild_id":"870355988887265301","channel_id":${privateThread},"session_id":"5da606d879de77e2287e7d26d2ddb04d","data":{"version":"1109844232824426714","id":"1109844232665059379","guild_id":"870355988887265301","name":"party","type":1,"options":[{"type":6,"name":"member","value":${currentBattles[battleKey][p1name].id}}],"application_command":{"id":"1109844232665059379","application_id":"1101145170466062416","version":"1109844232824426714","default_member_permissions":null,"type":1,"nsfw":false,"name":"party","description":"View/Edit your active party!","guild_id":"870355988887265301","options":[{"type":6,"name":"member","description":"…"}]},"attachments":[]}}`;
    let response1 = await fetch(interactionRequestUrl, {
        method: 'POST',
        headers: {
            authorization: token,
            "Content-Type": "application/json"
        }, 
        body: payload
    });
    if (response1.status != 204) {
        console.log(`Status ${response1.status}: ${response1.statusText}`);
        console.log(`${battleKey.replace('_', ' ')} deleted; failed to request ${p1name}'s party\n`);
        delete currentBattles[battleKey];
        return;
    }
    currentBattles[battleKey][p2name] = {};
    currentBattles[battleKey][p2name].chars = {};
    currentBattles[battleKey][p2name].id = turnResults.substring(turnResults.indexOf('\n**<@') + 5, turnResults.lastIndexOf('>**'));
    payload = `{"type":2,"application_id":"1101145170466062416","guild_id":"870355988887265301","channel_id":${privateThread},"session_id":"5da606d879de77e2287e7d26d2ddb04d","data":{"version":"1109844232824426714","id":"1109844232665059379","guild_id":"870355988887265301","name":"party","type":1,"options":[{"type":6,"name":"member","value":${currentBattles[battleKey][p2name].id}}],"application_command":{"id":"1109844232665059379","application_id":"1101145170466062416","version":"1109844232824426714","default_member_permissions":null,"type":1,"nsfw":false,"name":"party","description":"View/Edit your active party!","guild_id":"870355988887265301","options":[{"type":6,"name":"member","description":"…"}]},"attachments":[]}}`;
    let response2 = await fetch(interactionRequestUrl, {
        method: 'POST',
        headers: {
            authorization: token,
            "Content-Type": "application/json"
        }, 
        body: payload
    });
    if (response2.status != 204) {
        console.log(`Status ${response2.status}: ${response2.statusText}`);
        console.log(`${battleKey} deleted; failed to request ${p2name}'s party\n`);
        delete currentBattles[battleKey];
        return;
    }
    while (typeof currentBattles[battleKey][p1name].valid === 'undefined' || typeof currentBattles[battleKey][p2name].valid === 'undefined') {
        await delay(1);
    }
    if (!currentBattles[battleKey][p1name].valid || !currentBattles[battleKey][p2name].valid) {
        if (!currentBattles[battleKey][p1name].valid) {
            console.log(`${battleKey} was deleted because ${currentBattles[battleKey][p1name].reason}\n`);
        } else {
            console.log(`${battleKey} was deleted because ${currentBattles[battleKey][p2name].reason}\n`);
        }
        delete currentBattles[battleKey];
        return;
    }
    delete currentBattles[battleKey][p1name].valid;
    delete currentBattles[battleKey][p2name].valid;
    /* the following code is necessary because Rhymar's own bot
    sometimes does not round the resolve of characters correctly */
    let healthRegex = / (\*__(.+)__\*\*\*|\*(.+)\*) - \*\*(\d+)\*\*:heart:/g;
    for (let i = 0; i < 3; i++) {
        let healthMatch = healthRegex.exec(battleEmbed.fields[0].value);
        let charName = "";
        if (typeof healthMatch[2] !== 'undefined') {
            charName = healthMatch[2];
        } else {    //typeof healthMatch[3] !== 'undefined'
            charName = healthMatch[3];
        }
        //DEBUG
        if (typeof currentBattles[battleKey][p1name].chars[charName] === 'undefined') {
            console.log(`${charName} is undefined in ${p1name}'s party`);
            console.log(battleEmbed.fields[0].value);
            console.log(currentBattles[battleKey][p1name]);
        }
        let charResolve = parseInt(healthMatch[4]);
        if (currentBattles[battleKey][p1name].chars[charName].resolve != charResolve) {
            currentBattles[battleKey].log(`${charName}'s resolve was calculated to be ${currentBattles[battleKey][p1name].chars[charName].resolve} but it was actually ${charResolve}\n`);
        }
        currentBattles[battleKey][p1name].chars[charName].maxResolve = charResolve;
        currentBattles[battleKey][p1name].chars[charName].resolve = charResolve;
    }
    healthRegex.lastIndex = 0;
    for (let i = 0; i < 3; i++) {
        let healthMatch = healthRegex.exec(battleEmbed.fields[1].value);
        let charName = "";
        if (typeof healthMatch[2] !== 'undefined') {
            charName = healthMatch[2];
        } else {    //typeof healthMatch[3] !== 'undefined'
            charName = healthMatch[3];
        }
        //DEBUG
        if (typeof currentBattles[battleKey][p2name].chars[charName] === 'undefined') {
            console.log(`${charName} is undefined in ${p2name}'s party`);
            console.log(battleEmbed.fields[1].value);
            console.log(currentBattles[battleKey][p2name]);
        }
        let charResolve = parseInt(healthMatch[4]);
        if (currentBattles[battleKey][p2name].chars[charName].resolve != charResolve) {
            currentBattles[battleKey].log(`${charName}'s resolve was calculated to be ${currentBattles[battleKey][p2name].chars[charName].resolve} but it was actually ${charResolve}\n`);
        }
        currentBattles[battleKey][p2name].chars[charName].maxResolve = charResolve;
        currentBattles[battleKey][p2name].chars[charName].resolve = charResolve;
    }
    currentBattles[battleKey].log("");
}

//these characters have special moves that i am too lazy to code in
let excludedCharacters = [
    "True Kushida Kikyō",
    "False Ayanokōji Kiyotaka"
];

//members with these roles have strength level 3; need to boost stats 10%
let strengthRoles = [
    '1045704566362091530',   //student council
    '1109839051839766579',   //honami faction
    '1109839054679310336',   //kiyotaka faction
    '1109839026225152070',   //hiyori faction
    '1041352343175831552',   //kei faction
    '853288106504618005',    //ichika faction
    '1109839066691805265',   //suzune faction
    '1109839063575429212',   //sae faction,
    '1109839046026465380'    //arisu faction
];

async function setPlayerParty(playerName, imageURL, time) {
    let battleKey = "";
    for (let key in currentBattles) {
        if (key.includes(playerName) && Object.keys(currentBattles[key][playerName].chars).length < 3) {
            battleKey = key;
            break;
        }
    }
    if (battleKey == "") {
        return;
    }
    currentBattles[battleKey].time = time;
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
    currentBattles[battleKey].log(`${playerName}'s party:
Active: ${partyJSON[0]?.name} ${"⭐".repeat(partyJSON[0]?.numStars)}, ${partyJSON[1]?.name} ${"⭐".repeat(partyJSON[1]?.numStars)}, ${partyJSON[2]?.name} ${"⭐".repeat(partyJSON[2]?.numStars)}
Bench:  ${partyJSON[3]?.name} ${"⭐".repeat(partyJSON[3]?.numStars)}, ${partyJSON[4]?.name} ${"⭐".repeat(partyJSON[4]?.numStars)}, ${partyJSON[5]?.name} ${"⭐".repeat(partyJSON[5]?.numStars)}`);
    for (let i = 0; i < partyJSON.length; i++) {
        let char = partyJSON[i];
        if (char?.name == "empty") {
            //console.log(`There is no character in slot ${i + 1} of ${playerName}'s party.`);
        } else if (char !== null) {
            let charStats = await fetch(`http://127.0.0.1:2500/CharacterData/${char.name.replace(' ', '_')}/${char.numStars}`);
            if (charStats.status == 404) {
                currentBattles[battleKey][playerName].valid = false;
                currentBattles[battleKey][playerName].reason = 
`${char.name} with ${char.numStars} stars in ${playerName}'s party was not found in the database.
${playerName}'s id is '${currentBattles[battleKey][playerName].id}'`;
                return;
            } else {
                //console.log(`${char.name} with ${char.numStars} stars was found in the database!`);
                let charStatsJSON = await charStats.json();
                currentBattles[battleKey][playerName].chars[char.name] = charStatsJSON;
                if (i <= 2) {
                    currentBattles[battleKey][playerName].chars[char.name].active = true;
                } else {
                    currentBattles[battleKey][playerName].chars[char.name].active = false;
                }
            }
        } else {
            currentBattles[battleKey][playerName].valid = false;
            currentBattles[battleKey][playerName].reason = `character in slot ${i + 1} of ${playerName}'s party not found in image database.`;
            return;
        }
    }

    currentBattles[battleKey][playerName].baseStats = structuredClone(currentBattles[battleKey][playerName].chars);
    let baseStats = currentBattles[battleKey][playerName].baseStats;

    for (let charKey in currentBattles[battleKey][playerName].chars) {
        let thisChar = currentBattles[battleKey][playerName].chars[charKey];
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
 
    for (let charKey in currentBattles[battleKey][playerName].chars) {
        let thisChar = currentBattles[battleKey][playerName].chars[charKey];
        if (thisChar.active) {
            //boosts will keep track of things like unity, hate, and study. 
            thisChar.boosts = [];
            delete thisChar._id;
            delete thisChar.name;
            delete thisChar.active;
        } else {
            delete currentBattles[battleKey][playerName].chars[charKey];
        }
    }

    console.log(currentBattles[battleKey][playerName].chars);
    currentBattles[battleKey][playerName].initialStats = structuredClone(currentBattles[battleKey][playerName].chars);
    currentBattles[battleKey][playerName].valid = true;
}

function deleteBattle(p1name, p2name) {
    let battleKey = p1name + "_vs._" + p2name;
    delete currentBattles[battleKey];
}

//TODO: finish this
function suggestMoves(p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    console.log(`Turn ${turn} of ${battleKey}:\n${battleEmbed.fields[2].value.replaceAll(/\*/g, '')}`);
}

function updateBoosts(playerName, battleKey, turn) {
    for (let charKey in currentBattles[battleKey][playerName].chars) {
        let thisChar = currentBattles[battleKey][playerName].chars[charKey];
        let thisCharInitial = currentBattles[battleKey][playerName].initialStats[charKey];
        if (thisChar.resolve == 0) {
            continue;
        }
        for (let i = 0; i < thisChar.boosts.length; i++) {
            if (thisChar.boosts[i].endTurn == turn) {
                switch (thisChar.boosts[i].name) {
                    case 'Unity':
                        let unityBuff = 0.35;
                        thisChar.initiative = Math.round(thisChar.initiative - (thisCharInitial.initiative * unityBuff));
                        thisChar.mental     = Math.round(thisChar.mental     - (thisCharInitial.mental     * unityBuff));
                        thisChar.physical   = Math.round(thisChar.physical   - (thisCharInitial.physical   * unityBuff));
                        thisChar.social     = Math.round(thisChar.social     - (thisCharInitial.social     * unityBuff));
                        currentBattles[battleKey].log(`${charKey}'s Unity buff expired! Ability weakened by ${unityBuff}%.`);
                        break;
                    case 'Hate':
                        let hateDebuff = 0.35;
                        thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * hateDebuff));
                        thisChar.mental     = Math.round(thisChar.mental     + (thisCharInitial.mental     * hateDebuff));
                        thisChar.physical   = Math.round(thisChar.physical   + (thisCharInitial.physical   * hateDebuff));
                        thisChar.social     = Math.round(thisChar.social     + (thisCharInitial.social     * hateDebuff));
                        currentBattles[battleKey].log(`${charKey}'s Hate debuff expired! Ability increased by ${hateDebuff}%.`);
                        break;
                    case 'Study':
                        let initiativeBuff = 1;
                        let mentalBuff = 1.5;
                        thisChar.initiative = Math.round(thisChar.initiative / (1 + initiativeBuff));
                        thisChar.mental     = Math.round(thisChar.mental     / (1 + mentalBuff)    );
                        currentBattles[battleKey].log(`${charKey}'s Study buff expired! Initiative weakened by ${initiativeBuff}% and Mental weakened by ${mentalBuff}%`);
                        break;
                    case 'Arrogance':
                        let arroganceBuff = 0.4;
                        thisChar.initiative = Math.round(thisChar.initiative / (1 + arroganceBuff));
                        thisChar.mental     = Math.round(thisChar.mental     / (1 + arroganceBuff));
                        thisChar.physical   = Math.round(thisChar.physical   / (1 + arroganceBuff));
                        thisChar.social     = Math.round(thisChar.social     / (1 + arroganceBuff));
                        currentBattles[battleKey].log(`${charKey}'s Arrogance buff expired! Ability weakened by ${arroganceBuff}%.`);
                        break;
                    case 'Dominate':
                        let dominateDebuff = 0.75;
                        thisChar.initiative = Math.round(thisChar.initiative / (1 - dominateDebuff));
                        thisChar.mental     = Math.round(thisChar.mental     / (1 - dominateDebuff));
                        thisChar.physical   = Math.round(thisChar.physical   / (1 - dominateDebuff));
                        thisChar.social     = Math.round(thisChar.social     / (1 - dominateDebuff));
                        currentBattles[battleKey].log(`${charKey}'s Dominate debuff expired! Ability increased by ${dominateDebuff}%.`);
                        break;
                }
                thisChar.boosts.splice(i, 1);
                i--;
            }
        }
    }
}

startWsConnection();