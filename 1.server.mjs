// start with $ node 1.server
// this server primarily acts as an interface to interact with the gacha character database
// https://learn.microsoft.com/en-us/windows/wsl/networking
// if you want to run this in WSL, follow these steps:
// 1. Add an inbound rule in Windows Firewall allowing all TCP connections on port 27017
// 2. Edit mongod.cfg so that bindIp is 0.0.0.0
// 3. to get your windows host ip, run $ ip route show | grep -i default | awk '{ print $3}'
// 4. in these scripts, when connecting to the mongoDB database, replace 127.0.0.1 with your windows host ip
// in the case of this directory, change the ip Address in ipAddress.txt

import express from 'express';
import cors from 'cors';
import path from 'path';
import { connectToDb, getDb } from './serverModules/database.mjs';
import fs from 'fs';
import getPixels from 'get-pixels';

const server = express();
server.use(express.json());

const constsFile = './consts.json';
const configFile = './config.json';
const imageWidth = 328;

//allow requests to be made to this server from any url
server.use(cors({
    origin: '*'
}));

//database connection
let database;

connectToDb((error) => {
    if (!error) {
        //start server
        let consts = fs.readFileSync(constsFile, 'utf-8');
        let constsJSON = JSON.parse(consts);
        const port = constsJSON.port;
        server.listen(port, '127.0.0.1', () => {
            console.log(`Listening on port ${port}`);
        });
        database = getDb();
    }
})

server.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
})

//when making a request to this endpoint, replace all spaces
//in a character's name with underscores
server.get('/CharacterData/:name/:numStars', (req, res) => {
    let name = req.params.name.replace(/_/g, " ");
    let numStars = parseInt(req.params.numStars);
    database.collection('CharacterData')
        .findOne({
            name: name,
            numStars: numStars
        })
        .then(doc => {
            if (!doc) {
                res.status(404).send({
                    message: `${name} with ${numStars} stars isn't in the database`
                });
                return;
            }
            res.status(200).send(doc);
        })
})

server.post('/CharacterData/updateDb', (req, res) => {
    if (!req.body.name ||!req.body.rarity || !req.body.numStars || !req.body.personality || !req.body.moves
    || !req.body.resolve || !req.body.mental || !req.body.physical || !req.body.social || !req.body.initiative
    || !req.body.supportCategory || !req.body.supportBonus || !req.body.allies || !req.body.tags) {
        res.status(400).send({
            "message": "Bad request form"
        });
        return;
    }
    database.collection('CharacterData')
        .findOne({
            name: req.body.name,
            numStars: req.body.numStars,
        })
        .then(doc => {
            //if there is no document for this character, create it
            if (!doc) {
                database.collection('CharacterData')
                    .insertOne({
                        name: req.body.name,
                        rarity: req.body.rarity,
                        numStars: req.body.numStars,
                        personality: req.body.personality,
                        moves: req.body.moves,
                        resolve: req.body.resolve,
                        mental: req.body.mental,
                        physical: req.body.physical,
                        social: req.body.social,
                        initiative: req.body.initiative,
                        supportCategory: req.body.supportCategory,
                        supportBonus: req.body.supportBonus,
                        allies: req.body.allies,
                        tags: req.body.tags
                    });
                res.status(201).send({
                    message: "Added character to database"
                });
                return;
            }
            //else update it
            database.collection('CharacterData')
                .updateOne({
                    name: req.body.name,
                    numStars: req.body.numStars,
                }, 
                {
                    $set: {
                        name: req.body.name,
                        rarity: req.body.rarity,
                        numStars: req.body.numStars,
                        personality: req.body.personality,
                        moves: req.body.moves,
                        resolve: req.body.resolve,
                        mental: req.body.mental,
                        physical: req.body.physical,
                        social: req.body.social,
                        initiative: req.body.initiative,
                        supportCategory: req.body.supportCategory,
                        supportBonus: req.body.supportBonus,
                        allies: req.body.allies,
                        tags: req.body.tags
                    }
                });
            res.status(200).send({
                message: "Updated database"
            });
        })
})

server.get('/UserCollections/:userID', (req, res) => {
    //check if there is a document with this userid
    database.collection('UserCollections').
        findOne({
            userID: req.params.userID
        })
        .then(doc => {
            if (!doc) {
                res.status(404).send({
                    message: "That user's collection isn't in the database"
                });
                return;
            }
            res.status(200).send(doc);
        })
})

server.post('/UserCollections/updateDb', (req, res) => {
    //check if there is a document with this userid
    database.collection('UserCollections').
        findOne({
            userID: req.body.userID
        })
        .then(doc => {
            //if there isn't, create one
            if (!doc) {
                database.collection('UserCollections')
                    .insertOne({
                        userID: req.body.userID,
                        characters: [{
                            name: req.body.name,
                            rarity: req.body.rarity,
                            numStars: req.body.numStars,
                            personality: req.body.personality,
                            moves: req.body.moves,
                            resolve: req.body.resolve,
                            mental: req.body.mental,
                            physical: req.body.physical,
                            social: req.body.social,
                            initiative: req.body.initiative,
                            supportCategory: req.body.supportCategory,
                            supportBonus: req.body.supportBonus,
                            allies: req.body.allies,
                            tags: req.body.tags
                        }]
                    });
                res.status(201).send({
                    message: "Created document for user"
                });
                return;
            }
            //next check if the character in the request body is in this user's collection
            if (doc.characters.find(char => char.name == req.body.name)) {
                //if so, update that character
                database.collection('UserCollections')
                    .updateOne({
                        userID: req.body.userID,
                        "characters.name": req.body.name
                    }, 
                    {
                        $set: {
                            "characters.$.name": req.body.name,
                            "characters.$.rarity": req.body.rarity,
                            "characters.$.numStars": req.body.numStars,
                            "characters.$.personality": req.body.personality,
                            "characters.$.moves": req.body.moves,
                            "characters.$.resolve": req.body.resolve,
                            "characters.$.mental": req.body.mental,
                            "characters.$.physical": req.body.physical,
                            "characters.$.social": req.body.social,
                            "characters.$.initiative": req.body.initiative,
                            "characters.$.supportCategory": req.body.supportCategory,
                            "characters.$.supportBonus": req.body.supportBonus,
                            "characters.$.allies": req.body.allies,
                            "characters.$.tags": req.body.tags
                        }
                    });
                res.status(200).send({
                    message: "Updated character in user collection"
                });
                return;
            }
            //else push the character to the characters array
            database.collection('UserCollections')
                .updateOne({
                    userID: req.body.userID
                }, 
                {
                    $push: {
                        characters: {
                            name: req.body.name,
                            rarity: req.body.rarity,
                            numStars: req.body.numStars,
                            personality: req.body.personality,
                            moves: req.body.moves,
                            resolve: req.body.resolve,
                            mental: req.body.mental,
                            physical: req.body.physical,
                            social: req.body.social,
                            initiative: req.body.initiative,
                            supportCategory: req.body.supportCategory,
                            supportBonus: req.body.supportBonus,
                            allies: req.body.allies,
                            tags: req.body.tags
                        }
                    }
                })
            res.status(201).send({
                message: "Added character to user collection"
            });
        });
})

//returns the image data of all characters in the database
server.get("/ImageData", (req, res) => {
    var result = [];
    database.collection('ImageData')
        .find()
        .forEach(doc => result.push(doc))
        .then(() => {
            res.status(200).send(result)
        });
})

//send the image of a character to the database
//provide the URL of the party in the request body
//the character should be in slot 1 
//and the picture should be 328 x 254
server.post("/ImageData/updateDb", (req, res) => {
    if (!req.body.name || !req.body.imageURL) {
        res.status(400).send({
            message: "Request body must have name and imageURL properties"
        });
        return;
    }
    if (!/https:\/\/media\.discordapp\.net.+party\.jpeg.+format=png\&width=328\&height=254/.test(req.body.imageURL)) {
        res.status(400).send({
            message: "imageURL form is incorrect"
        });
        return;
    }
    getPixels(req.body.imageURL, function(err, pixels) {
        if(err) {
            console.log(`Bad image path (2): ${req.body.imageURL}`);
            res.status(400).send({
                message: "Invalid imageURL"
            })
            return;
        }
        let image = {
            name: req.body.name,
            pixels: pixels.data
        };
        let charImage = getSlot(24 , 23 , 97 , 79 , req.body.name, image);
        database.collection('ImageData')
            .findOne({
                name: req.body.name
            })
            .then(doc => {
                if (!doc) {
                    database.collection('ImageData')
                        .insertOne(charImage);
                    res.status(201).send({
                        message: "Added character's image to database"
                    });
                    return;
                } else {
                    database.collection('ImageData')
                        .updateOne({
                            name: req.body.name,
                        },
                        {
                            $set: {
                                pixels: charImage.pixels
                            }
                        }
                        );
                    res.status(200).send({
                        message: "Updated character's image in database"
                    });
                    return;
                }
            });
    });
})

//returns the characters in someone's party given the image of the party
//even though this is a POST request, it does not actually modify anything on the server
//I made this a POST request instead of a GET request so it can have a request body
//because having a URL as a request parameter causes issues since it contains /
server.post("/ImageData/parseParty", (req, res) => {
    if (!req.body.imageURL) {
        res.status(400).send({
            message: "Request body must imageURL properties"
        });
        return;
    }
    let imageURL = req.body.imageURL;
    getPixels(imageURL, function(err, pixels) {
        if(err) {
            console.log(`Bad image path (2): ${req.body.imageURL}`);
            console.log(`error: ${err}`);
            res.status(400).send({
                message: "Invalid imageURL"
            })
            return;
        }
        let partyImage = {
            name: 'image',
            pixels: pixels.data
        };
        let partySlots = [
            getSlot(24 , 23 , 97 , 79 , 'slot1', partyImage),
            getSlot(127, 23 , 200, 79 , 'slot2', partyImage),
            getSlot(230, 23 , 303, 79 , 'slot3', partyImage),
            getSlot(24 , 141, 97 , 197, 'slot4', partyImage),
            getSlot(127, 141, 200, 197, 'slot5', partyImage),
            getSlot(230, 141, 303, 197, 'slot6', partyImage)
        ];
        let party = [];
        party.length = 6;
        let databaseImages = [];
        database.collection('ImageData')
            .find()
            .forEach(image => databaseImages.push(image))
            .then(() => {
                for (let slot of partySlots) {
                    for (let image of databaseImages) {
                        if (slotDifference(slot, image) < 200000) {
                            let slotNumber = parseInt(/slot(\d+)/.exec(slot.name)[1]);
                            party[slotNumber - 1] = {};
                            party[slotNumber - 1].name = image.name;
                            if (image.name == 'empty') {
                                party[slotNumber - 1].numStars = 0;
                            } else {
                                party[slotNumber - 1].numStars = getNumStars(slot.name, partyImage);
                            }
                            party[slotNumber - 1].aspect = getAspect(slot.name, partyImage);
                            break;
                        }
                    }
                }
                res.status(200).send(party);
                return;
            })     
    });
})

function pixelArrayIndex(pixelX, pixelY) {
    return 4 * (imageWidth * pixelY + pixelX);
}

function getSlot(minX, minY, maxX, maxY, slotName, image) {
    let slot = {
        name: slotName,
        pixels: []
    };
    for (let i = minY; i <= maxY; i++) {
        let rowStartIndex = pixelArrayIndex(minX, i);
        let rowEndIndex = pixelArrayIndex(maxX, i) + 3;
        for (let j = rowStartIndex; j <= rowEndIndex; j++) {
            slot.pixels.push(image.pixels[j]);
        }
    }
    return slot;
}

function slotDifference(slot1, slot2) {
    if (slot1.pixels.length != slot2.pixels.length) {
        console.log(`Error: ${slot1.name} is ${slot1.pixels.length / 4} pixels but ${slot2.name} is ${slot2.pixels.length / 4} pixels.`);
        return;
    }
    let difference = 0;
    for (let i = 0; i < slot1.pixels.length; ++i) {
        difference += Math.abs(slot1.pixels[i] - slot2.pixels[i]);
    }
    return difference;
}

function RGBA_at(pixelX, pixelY, image) {
    let startIndex = pixelArrayIndex(pixelX, pixelY);
    return [image.pixels[startIndex], image.pixels[startIndex + 1], image.pixels[startIndex + 2], image.pixels[startIndex + 3]];
}

function RGBA_difference(pixel1, pixel2) {
    let difference = 0;
    for (let i = 0; i < 4; i++) {
        difference += Math.abs(pixel1[i] - pixel2[i]);
    }
    return difference;
}

function getNumStars(slotName, image) {
    //pixel values are chosen according to 4 star sato
    //except for the fifth star, which is chosen according to 5 star kei
    switch (slotName) {

        case 'slot1':
            if (RGBA_difference(RGBA_at(81, 92, image), [244, 130, 124, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(75, 92, image), [213, 80 , 123, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(65, 93, image), [243, 141, 136, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(59, 94, image), [219, 103, 104, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot2':
            if (RGBA_difference(RGBA_at(184, 92, image), [242, 127, 122, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(176, 93, image), [235, 116, 111, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(168, 94, image), [237, 114, 121, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(162, 95, image), [234, 119, 115, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot3':
            if (RGBA_difference(RGBA_at(286, 92, image), [246, 121, 121, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(279, 93, image), [235, 117, 111, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(270, 94, image), [248, 139, 135, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(265, 95, image), [235, 120, 115, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot4':
            if (RGBA_difference(RGBA_at(81, 210, image), [244, 123, 121, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(75, 210, image), [227, 101, 130, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(65, 211, image), [246, 154, 144, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(59, 213, image), [231, 115, 108, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot5':
            if (RGBA_difference(RGBA_at(184, 212, image), [240, 114, 106, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(175, 210, image), [246, 153, 133, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(167, 212, image), [248, 128, 129, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(162, 213, image), [227, 106, 109, 255]) > 55) {
                return 4;
            }
            return 5;

        case 'slot6':
            if (RGBA_difference(RGBA_at(287, 212, image), [240, 113, 106, 255]) > 55) {
                return 1;
            }
            if (RGBA_difference(RGBA_at(281, 210, image), [225, 97 , 128, 255]) > 55) {
                return 2;
            }
            if (RGBA_difference(RGBA_at(270, 212, image), [248, 128, 129, 255]) > 55) {
                return 3;
            }
            if (RGBA_difference(RGBA_at(265, 213, image), [227, 107, 109, 255]) > 55) {
                return 4;
            }
            return 5;
    }
}

function getAspect(slotName, image) {
    if (isInfernal(slotName, image)) {
        return "Infernal ";
    }
    if (isTitanium(slotName, image)) {
        return "Titanium ";
    }
    if (isTidal(slotName, image)) {
        return "Tidal ";
    }
    return "";
}

function isInfernal(slotName, image) {
    switch (slotName) {
        case 'slot1':
            return RGBA_difference(RGBA_at(20, 45, image), [237, 27, 36, 255]) == 0;
        case 'slot2':
            return RGBA_difference(RGBA_at(123, 45, image), [237, 27, 36, 255]) == 0;
        case 'slot3':
            return RGBA_difference(RGBA_at(226, 45, image), [237, 27, 36, 255]) == 0; 
        case 'slot4':
        case 'slot5':
        case 'slot6':
            return false;
    }
}

function isTitanium(slotName, image) {
    switch (slotName) {
        case 'slot1':
            return RGBA_difference(RGBA_at(20, 45, image), [255, 255, 255, 255]) == 0;
        case 'slot2':
            return RGBA_difference(RGBA_at(123, 45, image), [255, 255, 255, 255]) == 0;
        case 'slot3':
            return RGBA_difference(RGBA_at(226, 45, image), [255, 255, 255, 255]) == 0; 
        case 'slot4':
        case 'slot5':
        case 'slot6':
            return false;
    }
}

//implement this once there are tidal campaign enemiees
function isTidal(slotName, image) {
    switch (slotName) {
        case 'slot1':
        case 'slot2':
        case 'slot3':
        case 'slot4':
        case 'slot5':
        case 'slot6':
            return false;
    }
}

server.get("/getToken", (req, res) => {
    let config = fs.readFileSync(configFile, 'utf-8');
    let configJSON = JSON.parse(config);
    let token = configJSON.token;
    if (!token) {
        res.status(503).send({
            message: "error retrieving token from server"
        })
    }
    res.status(200).send({token: token});
});

//returns all battle logs
server.get("/BattleLogs", (req, res) => {
    var result = [];
    database.collection('BattleLogs')
        .find()
        .forEach(doc => result.push(doc))
        .then(() => {
            res.status(200).send(result)
        });
})

//returns the logs of all battles that the specified user battled in
server.get("/BattleLogs/:userId", (req, res) => {
    var result = [];
    database.collection('BattleLogs')
        .find({players: req.params.userId})
        .forEach(doc => result.push(doc))
        .then(() => {
            res.status(200).send(result)
        });
})
//example usage:
/*
let battleStr = "";
fetch('http://127.0.0.1:2500/BattleLogs/635172347606728746')
    .then(res => res.json())
    .then(battles => {
        for (battle of battles) {
            battleStr += battle.data + "\n"
        }
    })
    .then(() => console.log(battleStr));
*/

//adds battle log to database
server.post("/BattleLogs/updateDb", (req, res) => {
    if (!req.body.players || !req.body.time || !req.body.data) {
        res.status(400).send({
            message: "Request body must have players, time, and data properties"
        });
        return;
    }
    database.collection('BattleLogs')
        .insertOne({
            players: req.body.players,
            time: req.body.time,
            data: req.body.data
        });
    res.status(201).send({
        message: "Added battle log to database"
    });
    return;
})