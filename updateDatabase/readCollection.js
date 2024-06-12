/*
Must have 1.server.js running
Instructions:
1. start the server with $ node 1.server.js
2. copy this entire script and paste it into chrome's developer console
3. copy the Discord ID of the person whose collection you want to read it
4. run getCollection('their user ID pasted here') in console
Note: you may have to change how the right arrow button is identified; it seems to change from time to time
Make sure your port matches what is in consts.json
All the characters in the user's collection will be added to the database
*/

let myToken;
(async () => {
    let response = await fetch(`http://127.0.0.1:2700/getToken`, {
        method: 'GET',
        headers: {
            authorization: myToken,
            "Content-Type": "application/json"
        }
    });
    let responseJSON = await response.json();
    myToken = responseJSON.token;
})();

//navigate to the proper channel to use this
fetch(`http://127.0.0.1:2700`);

async function getCollection(userId) {
    let cardTotal = 0;
    const delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));
    let interactionRequestUrl = `https://discord.com/api/v9/interactions`;
    let url = window.location.href;
    let channelId = url.slice(url.lastIndexOf("/") + 1, url.length);
    /*
    I got this payload by opening the Network tab in developer tools, running the slash command, 
    selecting the corresponding request (labelled as "interactions"), copying the payload,
    and removing the nonce property.
    */
    let payload1 = `{"type":2,"application_id":"1101145170466062416","guild_id":"870355988887265301","channel_id":"${channelId}","session_id":"5dfdd138799858f2983c7dc2c7732a92","data":{"version":"1109844232824426712","id":"1109844232514048068","guild_id":"870355988887265301","name":"collection","type":1,"options":[{"type":6,"name":"member","value":"${userId}"}],"application_command":{"id":"1109844232514048068","application_id":"1101145170466062416","version":"1109844232824426712","default_member_permissions":null,"type":1,"nsfw":false,"name":"collection","description":"View your character collection!","guild_id":"870355988887265301","options":[{"type":6,"name":"member","description":"…"}]},"attachments":[]}}`;
    //making the slash command to request the user's collection
    await fetch(interactionRequestUrl, {
        method: 'POST',
        headers: {
            authorization: myToken,
            "Content-Type": "application/json"
        }, 
        body: payload1
    });
    await delay(1000);
    //getting the id of the message that was the reponse to the slash request made
    let requestUrl = `https://discord.com/api/v9/channels/${channelId}`;
    let response1 = await fetch(requestUrl, {
        method: 'GET',
        headers: {
            authorization: myToken,
            "Content-Type": "application/json"
        }
    });
    let response1JSON = await response1.json();
    let messageId = BigInt(response1JSON.last_message_id) + BigInt('1');
    await delay(500);
    //now reading reading the first item in the collection
    let readRequestUrl = `https://discord.com/api/v9/channels/${channelId}/messages?before=${messageId}&limit=50`;
    let response2 = await fetch(readRequestUrl, {
        method: 'GET',
        headers: {
            authorization: myToken
        }
    });
    let response2JSON = await response2.json();
    let embed = response2JSON[0].embeds[0];
    //getting the number of characters they own
    let collectionSize = parseInt(embed.footer.text.slice(embed.footer.text.lastIndexOf("/") + 1, embed.footer.text.lastIndexOf(")")));
    examinedChars = [];
    let buttons = document.getElementsByClassName("button__581d0 lookFilled__950dd colorPrimary_ebe632 sizeSmall_da7d10 grow__4c8a4");
    let rightArrowButton = buttons[buttons.length - 1];
    //now getting the names of all the other characters they own
    while (examinedChars.length != collectionSize) {
        let response3 = await fetch(readRequestUrl, {
            method: 'GET',
            headers: {
                authorization: myToken
            }
        });
        let response3JSON = await response3.json();
        embed = response3JSON[0].embeds[0];
        let name = embed.title.substring(embed.title.indexOf("> ") + 2, embed.title.indexOf("⭐") - 1);
        if (!examinedChars.includes(name)) {
            examinedChars.push(name);
            let rarityEmoji = embed.title.substring(0, embed.title.indexOf(">") + 1);
            let rarity = "";
            switch (rarityEmoji) {
                case "<:common:1105901985024192642>":
                    rarity = "Common";
                    break;
                case "<:glowing:1105937849976631417>":
                    rarity = "Glowing";
                    break;
                case "<:shining:1105901981299638343>":
                    rarity = "Shining";
                    break;
                case "<:special:1107411921201799238>":
                    rarity = "Special";
                    break;
            }
            let numStars = embed.title.lastIndexOf("⭐") - embed.title.indexOf("⭐") + 1;
            let charInfo = embed.description;
            let personality = charInfo.substring(charInfo.indexOf("Personality: **") + 15, charInfo.indexOf("**\nMoves"));
            let moves = charInfo.substring(charInfo.indexOf("Moves: **") + 9, charInfo.indexOf("**\n\nResolve")).split(", ");
            let resolve = parseInt(charInfo.substring(charInfo.indexOf("Resolve: **") + 11, charInfo.indexOf("**\nMental")));
            let mental = parseInt(charInfo.substring(charInfo.indexOf("Mental: **") + 10, charInfo.indexOf("**\nPhysical")));
            let physical = parseInt(charInfo.substring(charInfo.indexOf("Physical: **") + 12, charInfo.indexOf("**\nSocial")));
            let social = parseInt(charInfo.substring(charInfo.indexOf("Social: **") + 10, charInfo.indexOf("**\nInitiative")));
            let initiative = parseInt(charInfo.substring(charInfo.indexOf("Initiative: **") + 14, charInfo.indexOf("**\n\nSupport")));
            let allies = charInfo.substring(charInfo.indexOf("to ally *") + 9, charInfo.lastIndexOf("* ")).split("* and *");
            let supportCategory = charInfo.substring(charInfo.indexOf(`${allies[allies.length - 1]}* **`) + allies[allies.length - 1].length + 4, charInfo.lastIndexOf("**"));  
            let supportBonus = parseInt(charInfo.substring(charInfo.indexOf("Support Bonus: **+") + 18, charInfo.indexOf("%** to ally")));
            let tags = embed.footer.text.slice(6, embed.footer.text.indexOf("\n")).split(", ");

            let regex = /\((.+)\//g;
            let fraction;
            let numThisCard = 0;
            switch (rarity) {
                case "Common":
                    //1 star- 1 card
                    //2 stars- 6 cards
                    //3 stars- 11 cards
                    cardTotal += 1 + (numStars - 1) * 5;
                    numThisCard += 1 + (numStars - 1) * 5;
                    fraction = regex.exec(embed.title)?.[1];  //200, 400, ..., Max Level (null)
                    if (typeof fraction !== 'undefined') {
                        cardTotal += fraction / 200;
                        numThisCard += fraction / 200;
                    }
                    regex.lastIndex = 0;
                    break;
                case "Glowing":
                    //1 star- 1 card
                    //2 stars- 3 cards
                    //3 stars- 5 cards
                    cardTotal += 1 + (numStars - 1) * 2;
                    numThisCard += 1 + (numStars - 1) * 2;
                    fraction = regex.exec(embed.title)?.[1];  //200, 400, ..., Max Level (null)
                    if (typeof fraction !== 'undefined') {
                        cardTotal += fraction / 500;
                        numThisCard += fraction / 500;
                    }
                    regex.lastIndex = 0;
                    break;
                case "Shining":
                    cardTotal += numStars;
                    numThisCard += numStars;
                    break;
                case "Special":     //don't count these
                    numThisCard += numStars;
                    break;
            }
            //if you want to print how many they have of each card
            // if (numThisCard == 1) {
            //     console.log(`${userId} has ${numThisCard} ${name}`);
            // } else {
            //     console.log(`${userId} has ${numThisCard} ${name}s`);
            // }

            let success = false;
            while (!success) {
                let res = await fetch(`http://127.0.0.1:2700/CharacterData/updateDb`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        name: name,
                        rarity: rarity,
                        numStars: numStars,
                        personality: personality,
                        moves: moves,
                        resolve: resolve,
                        mental: mental,
                        physical: physical,
                        social: social,
                        initiative: initiative,
                        supportCategory: supportCategory,
                        supportBonus: supportBonus,
                        allies: allies,
                        tags: tags
                    })
                });
                if (res.status < 400) {
                    success = true;
                } else {
                    await delay(1000);
                }
            }

            success = false;
            while (!success) {
                let res = await fetch(`http://127.0.0.1:2700/UserCollections/updateDb`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        userId: userId,
                        name: name,
                        rarity: rarity,
                        numStars: numStars,
                        personality: personality,
                        moves: moves,
                        resolve: resolve,
                        mental: mental,
                        physical: physical,
                        social: social,
                        initiative: initiative,
                        supportCategory: supportCategory,
                        supportBonus: supportBonus,
                        allies: allies,
                        tags: tags
                    })
                });
                if (res.status < 400) {
                    success = true;
                } else {
                    await delay(1000);
                }
            }

            rightArrowButton.click();
            await delay(400);
        }
    }
    console.log(`${userId} has ${cardTotal} cards in their collection excluding specials`);
    console.log(`${userId}'s collection sent to database!`);
}

/*

let userIdsObj = {
	"778931848079736863": "usfi",
	"694181730017345632": "Mr K",
	"540717411364634663": "c5",
	"258292090599899137": "Enexis",
	"860244803514007583": "Fisher",
	"202873006773633024": "Yase",
	"774505195278565396": "Blitzin",
	"1075011865060581386": "Concur",
	"759480272403300354": "Kouenji Fan",
	"306822096972152834": "Desroam",
	"1107835130845859850": "Majesty",
	"973390681936654346": "The Reaper of Death",
	"664082116870537217": "b.unny",
	"635172347606728746": "Ackerman",
	"455888741530075154": "ChaoticPoly",
    "997600606715920495": "Escanor",
    "277933921315061761": "Tommy3", 
    "372326699674632203": "ComaVent",
    "562579663831171092": "Psychocat",
    "737284960829833278": "Darkludge",
    "761153689581912076": "Aryan",
    "409399651163308032": "Yuppi", 
    "1145395629972017344": "Futaba",
    "1002852855021064312": "Saezy", 
    "318114554494058499": "Utku",
    "1180948422891675812": "Vicenzo",
    "257841137165795328": "Pris",
    "209985174081896450": "Rhymar",
    "698999829711421540": "Freshora"
}

let userIds = Object.keys(userIdsObj);

(async () => {
    for (let i = 0; i < userIds.length; ++i) {
        console.log(`Getting ${userIds[i]}'s collection...`);
        await getCollection(userIds[i]);
        console.log(`${i + 1} out of ${userIds.length} collections finished.`);
    }
})()

*/