//endpoints that access the CharacterData collection.
import express from 'express';

const CharacterDataRouter = (sharedData) => {
    const router = express.Router();

    //return all character data
    router.get("/", (req, res) => {
        var result = [];
        sharedData.database.collection('CharacterData')
            .find()
            .forEach(doc => result.push(doc))
            .then(() => {
                res.status(200).send(result)
            });
    })

    //when making a request to this endpoint, replace all spaces
    //in a character's name with underscores
    router.get('/:name/:numStars', (req, res) => {
        let name = req.params.name.replace(/_/g, " ");
        let numStars = parseInt(req.params.numStars);
        sharedData.database.collection('CharacterData')
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

    router.post('/updateDb', (req, res) => {
        if (!req.body.name ||!req.body.rarity || !req.body.numStars || !req.body.personality || !req.body.moves
        || !req.body.resolve || !req.body.mental || !req.body.physical || !req.body.social || !req.body.initiative
        || !req.body.supportCategory || !req.body.supportBonus || !req.body.allies || !req.body.tags) {
            res.status(400).send({
                "message": "Bad request form"
            });
            return;
        }
        sharedData.database.collection('CharacterData')
            .findOne({
                name: req.body.name,
                numStars: req.body.numStars,
            })
            .then(doc => {
                //if there is no document for this character, create it
                if (!doc) {
                    sharedData.database.collection('CharacterData')
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
                sharedData.database.collection('CharacterData')
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

    return router;
}

export default CharacterDataRouter;