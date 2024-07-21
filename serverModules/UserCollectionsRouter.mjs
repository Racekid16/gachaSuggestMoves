//endpoints that access the UserCollections collection.
import express from 'express';

const UserCollectionsRouter = (sharedData) => {
    const router = express.Router();

    //return all user collections
    router.get("/", (req, res) => {
        var result = [];
        sharedData.database.collection('UserCollections')
            .find()
            .forEach(doc => result.push(doc))
            .then(() => {
                res.status(200).send(result)
            });
    })

    router.get('/:userID', (req, res) => {
        //check if there is a document with this userid
        sharedData.database.collection('UserCollections').
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

    router.post('/updateDb', (req, res) => {
        //check if there is a document with this userid
        sharedData.database.collection('UserCollections').
            findOne({
                userID: req.body.userID
            })
            .then(doc => {
                //if there isn't, create one
                if (!doc) {
                    sharedData.database.collection('UserCollections')
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
                    sharedData.database.collection('UserCollections')
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
                sharedData.database.collection('UserCollections')
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

    return router;
}

export default UserCollectionsRouter;