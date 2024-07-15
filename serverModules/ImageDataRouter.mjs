//endpoints that access the ImageData collection.
import express from 'express';
import getPixels from 'get-pixels';
import { getSlot, slotDifference, getNumStars, getAspect } from './parseImage.mjs';

const ImageDataRouter = (sharedData) => {
    const router = express.Router();

    //return all image data
    router.get("/", (req, res) => {
        var result = [];
        sharedData.database.collection('ImageData')
            .find()
            .forEach(doc => result.push(doc))
            .then(() => {
                res.status(200).send(result)
            });
    })

    //send the image of a character to the sharedData.database
    //provide the URL of the party in the request body
    //the character should be in slot 1 
    //and the picture should be 328 x 254
    router.post("/updateDb", (req, res) => {
        if (!req.body.name || !req.body.imageURL) {
            res.status(400).send({
                message: "Request body must have name and imageURL properties"
            });
            return;
        }
        if (!/https:\/\/media\.discordrouter\.net.+party\.jpeg.+format=png\&width=328\&height=254/.test(req.body.imageURL)) {
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
            sharedData.database.collection('ImageData')
                .findOne({
                    name: req.body.name
                })
                .then(doc => {
                    if (!doc) {
                        sharedData.database.collection('ImageData')
                            .insertOne(charImage);
                        res.status(201).send({
                            message: "Added character's image to sharedData.database"
                        });
                        return;
                    } else {
                        sharedData.database.collection('ImageData')
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
                            message: "Updated character's image in sharedData.database"
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
    router.post("/parseParty", (req, res) => {
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
            sharedData.database.collection('ImageData')
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

    return router;
}

export default ImageDataRouter;