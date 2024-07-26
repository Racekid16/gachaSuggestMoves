//endpoints that access the BattleLogs collection.
import express from 'express';

const BattleLogsRouter = (sharedData) => {
    const router = express.Router();

    //return all battle logs
    router.get("/", (req, res) => {
        var result = [];
        sharedData.database.collection('BattleLogs')
            .find()
            .forEach(doc => result.push(doc))
            .then(() => {
                res.status(200).send(result)
            });
    })

    //returns the logs of all battles that the specified user battled in
    router.get("/player/:userId", (req, res) => {
        var result = [];
        sharedData.database.collection('BattleLogs')
            .find({players: req.params.userId})
            .forEach(doc => result.push(doc))
            .then(() => {
                res.status(200).send(result)
            });
    })

    //returns the logs of all battles that contain a specific string (case-sensitive)
    router.get("/contains/:substring", (req, res) => {
        var result = [];
        sharedData.database.collection('BattleLogs')
            .find({data: {$regex: req.params.substring }})
            .forEach(doc => result.push(doc))
            .then(() => {
                res.status(200).send(result)
            });
    })

    //adds battle log to database
    router.post("/updateDb", (req, res) => {
        if (!req.body.players || !req.body.time || !req.body.data) {
            res.status(400).send({
                message: "Request body must have players, time, and data properties"
            });
            return;
        }
        sharedData.database.collection('BattleLogs')
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

    return router;
}

export default BattleLogsRouter;