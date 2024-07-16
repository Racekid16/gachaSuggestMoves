//endpoints for sending data to from the server to the client on the socket
import express from 'express';

const socketRouter = (sharedData) => {
    const router = express.Router();

    router.post("/battleStart", (req, res) => {
        sharedData.io.emit('battleStart', req.body);
        res.status(204).send();
    })

    router.post("/playerParty", (req, res) => {
        sharedData.io.emit('playerParty', req.body);
        res.status(204).send();
    })

    router.post("/battleEnd", (req, res) => {
        sharedData.io.emit('battleEnd', req.body);
        res.status(204).send();
    })

    router.post("/turnResults", (req, res) => {
        sharedData.io.emit('turnResults', req.body);
        res.status(204).send();
    })

    router.post("/suggestedMoves", (req, res) => {
        sharedData.io.emit('suggestedMoves', req.body);
        res.status(204).send();
    })

    return router;
}

export default socketRouter;