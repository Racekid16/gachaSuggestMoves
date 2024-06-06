// Create and delete battles from the battleObj.
import config from '../config.json' assert { type: 'json' };
const delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));

export async function createBattle(battleObj, p1name, p2name, battleEmbed) {
    let battleKey = p1name + "_vs._" + p2name;
    let turnResults = battleEmbed.fields[2].value;
    battleObj[battleKey] = {};
    battleObj[battleKey][p1name] = {};
    battleObj[battleKey][p1name].chars = {};
    battleObj[battleKey][p1name].id = turnResults.substring(turnResults.indexOf('**<@') + 4, turnResults.indexOf('>**'));
    battleObj[battleKey].data = "";
    let payload = `{"type":2,"application_id":"1101145170466062416","guild_id":"870355988887265301","channel_id":${config.privateThread},"session_id":"5da606d879de77e2287e7d26d2ddb04d","data":{"version":"1109844232824426714","id":"1109844232665059379","guild_id":"870355988887265301","name":"party","type":1,"options":[{"type":6,"name":"member","value":${battleObj[battleKey][p1name].id}}],"application_command":{"id":"1109844232665059379","application_id":"1101145170466062416","version":"1109844232824426714","default_member_permissions":null,"type":1,"nsfw":false,"name":"party","description":"View/Edit your active party!","guild_id":"870355988887265301","options":[{"type":6,"name":"member","description":"…"}]},"attachments":[]}}`;
    let response1 = await fetch('https://discord.com/api/v9/interactions', {
        method: 'POST',
        headers: {
            authorization: config.token,
            "Content-Type": "application/json"
        }, 
        body: payload
    });
    if (response1.status != 204) {
        console.log(`Status ${response1.status}: ${response1.statusText}`);
        console.log(`${battleKey.replace('_', ' ')} deleted; failed to request ${p1name}'s party\n`);
        delete battleObj[battleKey];
        return;
    }
    battleObj[battleKey][p2name] = {};
    battleObj[battleKey][p2name].chars = {};
    battleObj[battleKey][p2name].id = turnResults.substring(turnResults.indexOf('\n**<@') + 5, turnResults.lastIndexOf('>**'));
    payload = `{"type":2,"application_id":"1101145170466062416","guild_id":"870355988887265301","channel_id":${config.privateThread},"session_id":"5da606d879de77e2287e7d26d2ddb04d","data":{"version":"1109844232824426714","id":"1109844232665059379","guild_id":"870355988887265301","name":"party","type":1,"options":[{"type":6,"name":"member","value":${battleObj[battleKey][p2name].id}}],"application_command":{"id":"1109844232665059379","application_id":"1101145170466062416","version":"1109844232824426714","default_member_permissions":null,"type":1,"nsfw":false,"name":"party","description":"View/Edit your active party!","guild_id":"870355988887265301","options":[{"type":6,"name":"member","description":"…"}]},"attachments":[]}}`;
    let response2 = await fetch('https://discord.com/api/v9/interactions', {
        method: 'POST',
        headers: {
            authorization: config.token,
            "Content-Type": "application/json"
        }, 
        body: payload
    });
    if (response2.status != 204) {
        console.log(`Status ${response2.status}: ${response2.statusText}`);
        console.log(`${battleKey} deleted; failed to request ${p2name}'s party\n`);
        delete battleObj[battleKey];
        return;
    }
    while (typeof battleObj[battleKey][p1name].valid === 'undefined' || typeof battleObj[battleKey][p2name].valid === 'undefined') {
        await delay(1);
    }
    if (!battleObj[battleKey][p1name].valid || !battleObj[battleKey][p2name].valid) {
        if (!battleObj[battleKey][p1name].valid) {
            console.log(`${battleKey} was deleted because ${battleObj[battleKey][p1name].reason}\n`);
        } else {
            console.log(`${battleKey} was deleted because ${battleObj[battleKey][p2name].reason}\n`);
        }
        delete battleObj[battleKey];
        return;
    }
    delete battleObj[battleKey][p1name].valid;
    delete battleObj[battleKey][p2name].valid;
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
        if (typeof battleObj[battleKey][p1name].chars[charName] === 'undefined') {
            console.log(`${charName} is undefined in ${p1name}'s party`);
            console.log(battleEmbed.fields[0].value);
            console.log(battleObj[battleKey][p1name]);
        }
        let charResolve = parseInt(healthMatch[4]);
        if (battleObj[battleKey][p1name].chars[charName].resolve != charResolve) {
            console.log(`${charName}'s resolve was calculated to be ${battleObj[battleKey][p1name].chars[charName].resolve} but it was actually ${charResolve}\n`);
        }
        battleObj[battleKey][p1name].chars[charName].maxResolve = charResolve;
        battleObj[battleKey][p1name].chars[charName].resolve = charResolve;
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
        if (typeof battleObj[battleKey][p2name].chars[charName] === 'undefined') {
            console.log(`${charName} is undefined in ${p2name}'s party`);
            console.log(battleEmbed.fields[1].value);
            console.log(battleObj[battleKey][p2name]);
        }
        let charResolve = parseInt(healthMatch[4]);
        if (battleObj[battleKey][p2name].chars[charName].resolve != charResolve) {
            console.log(`${charName}'s resolve was calculated to be ${battleObj[battleKey][p2name].chars[charName].resolve} but it was actually ${charResolve}\n`);
        }
        battleObj[battleKey][p2name].chars[charName].maxResolve = charResolve;
        battleObj[battleKey][p2name].chars[charName].resolve = charResolve;
    }
    console.log("");
}

export function deleteBattle(battleObj, p1name, p2name) {
    let battleKey = p1name + "_vs._" + p2name;
    let turnResults = battleEmbed.fields[2].value;
    let winnerId = /<@(\d+)>/.exec(turnResults)[1];
    let winner;
    let loser;
    if (currentBattles[battleKey][p1name].id == winnerId) {
        winner = p1name;
        loser = p2name;
    } else {
        winner = p2name;
        loser = p1name;
    }
    if (!turnResults.includes("forfeit by inactivity")) {
        currentBattles[battleKey].log(`${winner} won against ${loser}\n`)
    } else {
        currentBattles[battleKey].log(`${winner} won against ${loser} (forfeit by inactivity)\n`);
    }
    delete battleObj[battleKey];
}