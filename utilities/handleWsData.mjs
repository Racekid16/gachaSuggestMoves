// handle data received from the websocket. 

import { createBattle, createCampaignBattle, deleteBattle, verifyPlayerResolves, requestPlayerPartyCampaignBattle } from "./battleManager.mjs";
import { setPlayerParty } from "./setPlayerParty.mjs";
import { parseTurnResults } from "./parseTurnResults.mjs";
import config from '../config.json' assert { type: 'json' };
import consts from '../consts.json' assert { type: 'json' };

export function handleWsData(battleObj, responseJSON) {
    // update an ongoing battle
    if ((responseJSON.t == 'MESSAGE_CREATE' || responseJSON.t == 'MESSAGE_UPDATE') && responseJSON.d.author?.id == consts.botID 
    && responseJSON.d.embeds?.[0]?.title?.substring(0, 6) == "BATTLE" && responseJSON.d.embeds[0].fields.length == 3) {
        processBattleEmbed(battleObj, responseJSON.d.embeds[0]);
    }

    // set the party of a player whose party was just requested by the script (see battleManager.mjs's createBattle function)
    else if (responseJSON.t == 'MESSAGE_UPDATE' && responseJSON.d.author?.id == consts.botID && responseJSON.d.embeds.length > 0
    && responseJSON.d.channel_id == config.privateThread && /.+'s Party/.test(responseJSON.d.embeds[0]?.author?.name)) {
        let playerName = /(.+)'s Party/.exec(responseJSON.d.embeds[0]?.author.name)[1];
        let imageURL = responseJSON.d.embeds[0].image.proxy_url + 'format=png&width=328&height=254';
        setPlayerParty(battleObj, playerName, imageURL);
    }

    // create an entry in battleObj representing a campaign battle
    else if (responseJSON.t == 'MESSAGE_UPDATE' && responseJSON.d.author?.id == consts.botID && responseJSON.d.embeds.length > 0
    && /Campaign Stage \d+/.test(responseJSON.d.embeds[0]?.author?.name) && responseJSON.d.embeds[0].image?.proxy_url) {
        let playerName = responseJSON.d.interaction_metadata.user.global_name;
        let playerID = responseJSON.d.interaction_metadata.user.id;
        let botPartyImageURL = responseJSON.d.embeds[0].image.proxy_url + 'format=png&width=328&height=254';
        let stage = /Campaign Stage (\d+)/.exec(responseJSON.d.embeds[0].author.name)[1];
        let battleKey = playerName + "_vs._Chairman Sakayanagi"
        if (typeof battleObj[battleKey] !== 'undefined') {
            deleteBattle(battleObj, playerName, 'Chairman Sakayanagi', null);
        }
        if (consts.excludedCampaignStages.includes(stage)) {
            console.log(`${playerName} vs. Chairman Sakayanagi not being tracked; Stage ${stage} is excluded`);
            return;
        }
        createCampaignBattle(battleObj, playerName, playerID, botPartyImageURL, stage);
    }

    // request a player's party for a campaign battle when it starts
    else if (responseJSON.t == 'MESSAGE_UPDATE' && responseJSON.d.author?.id == consts.botID && responseJSON.d.embeds.length > 0
    && /Campaign Stage \d+/.test(responseJSON.d.embeds[0]?.author?.name) && !responseJSON.d.embeds[0].image?.proxy_url) {
        let playerID = responseJSON.d.interaction_metadata.user.id;
        let playerName = responseJSON.d.interaction_metadata.user.global_name;
        if (typeof battleObj.usernames[playerID] !== 'undefined') {
            playerName = battleObj.usernames[playerID];
        }
        let battleKey = playerName + "_vs._Chairman Sakayanagi"
        if (typeof battleObj[battleKey] === 'undefined') {
            return;
        }
        requestPlayerPartyCampaignBattle(battleObj, battleKey, playerName, playerID);
    }

    // bot had an error when it attempted to fetch requested party; re-request both parties
    else if (responseJSON.t == 'INTERACTION_FAILURE') {
        let lastBattle = battleObj.currentBattles[battleObj.currentBattles.length - 1];
        let battleType = lastBattle[0];
        let p1name = lastBattle[1];
        let p2name = lastBattle[2];
        if (battleType == "battle") {
            deleteBattle(battleObj, p1name, p2name, null);
            let battleEmbed = lastBattle[3];
            createBattle(battleObj, p1name, p2name, battleEmbed);
        }
        else if (battleType == "campaign") {
            let battleKey = p1name + "_vs._" + p2name;
            let playerID = lastBattle[3];
            requestPlayerPartyCampaignBattle(battleObj, battleKey, p1name, playerID);
        }
    }
}

async function processBattleEmbed(battleObj, battleEmbed) {
    let p1name = battleEmbed.fields[0].name;
    let p2name = battleEmbed.fields[1].name;
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    
    if (typeof battleObj[battleKey] === 'undefined' && turn == 1 && p2name != 'Chairman Sakayanagi') {
        createBattle(battleObj, p1name, p2name, battleEmbed);
        return;
    } 

    else if (typeof battleObj[battleKey] === 'undefined') {
        console.log(`${battleKey} is undefined`);
        return;
    }

    else if (battleEmbed.fields[2].name == 'WINNER:') {
        let turnResults = battleEmbed.fields[2].value;
        deleteBattle(battleObj, p1name, p2name, turnResults);
        return;
    }

    if (typeof battleObj[battleKey] !== 'undefined' && turn == 1 && battleObj[battleKey][p2name].id == consts.botID) {
        verifyPlayerResolves(battleObj, battleKey, p1name, 1, battleEmbed);
        verifyPlayerResolves(battleObj, battleKey, p2name, 2, battleEmbed);
    }
    
    parseTurnResults(battleObj, p1name, p2name, battleEmbed);
}