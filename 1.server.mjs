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
import { fileURLToPath } from 'url';
import path from 'path';
import getPixels from 'get-pixels';
import { connectToDb, getDb } from './serverModules/database.mjs';
import { getSlot, slotDifference, getNumStars, getAspect } from './serverModules/parseImage.mjs';
import consts from './consts.json' assert { type: 'json' };
import config from './config.json' assert { type: 'json' };

const server = express();
server.use(express.json());

//allow requests to be made to this server from any url
server.use(cors({
    origin: '*'
}));

//database connection
let database;

connectToDb((error) => {
    if (!error) {
        //start server
        const port = consts.port;
        server.listen(port, '127.0.0.1', () => {
            console.log(`Listening on port ${port}`);
        });
        database = getDb();
    }
})

server.get("/", (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
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
        if (err) {
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

server.get("/getToken", (req, res) => {
    let token = config.token;
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