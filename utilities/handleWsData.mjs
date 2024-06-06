// handle data received from the websocket. 

import { createBattle, deleteBattle } from "./battleManager.mjs";
import { setPlayerParty } from "./setPlayerParty.mjs";
import { suggestMoves } from "./suggestMoves.mjs";
import config from '../config.json' assert { type: 'json' };

export function handleWsData(battleObj, responseJSON) {
    // update an ongoing battle
    if ((responseJSON.t == 'MESSAGE_CREATE' || responseJSON.t == 'MESSAGE_UPDATE') && responseJSON.d.author?.id == config.botID 
    && responseJSON.d.embeds.length != 0 && responseJSON.d.embeds[0].title.substring(0, 6) == "BATTLE" 
    && responseJSON.d.embeds[0].fields.length == 3) {
        processBattleEmbed(battleObj, responseJSON.d.embeds[0]);
    
    // create a new battle that has just started/
    } else if (responseJSON.t == 'MESSAGE_UPDATE' && responseJSON.d.author?.id == config.botID && responseJSON.d.embeds.length > 0
    && responseJSON.d.channel_id == config.privateThread && /.+'s Party/.test(responseJSON.d.embeds[0]?.author?.name)) {
        let playerName = /(.+)'s Party/.exec(responseJSON.d.embeds[0]?.author.name)[1];
        let imageURL = responseJSON.d.embeds[0].image.proxy_url;
        let modifiedURL = imageURL + 'format=png&width=328&height=254';
        setPlayerParty(battleObj, playerName, modifiedURL);
    }
}

async function processBattleEmbed(battleObj, battleEmbed) {
    let p1name = battleEmbed.fields[0].name;
    let p2name = battleEmbed.fields[1].name;
    let battleKey = p1name + "_vs._" + p2name;
    let turn = parseInt(battleEmbed.fields[2].name.substring(battleEmbed.fields[2].name.indexOf('__Turn ') + 7, battleEmbed.fields[2].name.length - 2));
    if (typeof battleObj[battleKey] === 'undefined' && turn == 1) {
        if (battleKey.includes('Chairman Sakayanagi')) {
            console.log(`${p1name} vs. ${p2name} is not being logged because Chairman Sakayanagi is one of the players\n`);
            return;
        }
        console.log(`${p1name} vs. ${p2name} started`);
        createBattle(battleObj, p1name, p2name, battleEmbed);
        return;
    } 
    if (typeof battleObj[battleKey] === 'undefined') {
        return;
    }
    if (battleEmbed.fields[2].name == 'WINNER:') {
        deleteBattle(battleObj, p1name, p2name);
        return;
    }
    suggestMoves(battleObj, p1name, p2name, battleEmbed);
}