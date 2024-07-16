//endpoints for sending data to from the server to the client on the socket
import express from 'express';

const socketRouter = (sharedData) => {
    const router = express.Router();

    router.get("/", (req, res) => {
        //TODO: finish
        sharedData.io.emit('new-data', 'Hello from the server!');
        res.status(204).send();
    })

    return router;
}

export default socketRouter;