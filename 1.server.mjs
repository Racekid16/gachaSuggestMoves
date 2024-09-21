/*
start with $ node 1.server.mjs
this server primarily acts as an interface to interact with the gacha character database
and as a host websocket server that acts as an intermediary for the webpage and program to communicate
https://learn.microsoft.com/en-us/windows/wsl/networking
if you want to run this in WSL, follow these steps:
1. Add an inbound rule in Windows Firewall allowing all TCP connections on port 27017
2. Edit mongod.cfg so that bindIp is 0.0.0.0
3. to get your windows host ip, run $ ip route show | grep -i default | awk '{ print $3}'
4. in these scripts, when connecting to the mongoDB database, replace 127.0.0.1 with your windows host ip
in the case of this directory, change the ip Address in ipAddress.txt
*/

import express from 'express';
import http from 'http';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import { connectToDb, getDb } from './serverModules/database.mjs';
import { BattleLogsRouter } from './serverModules/BattleLogsRouter.mjs';
import { CharacterDataRouter } from './serverModules/CharacterDataRouter.mjs';
import { ImageDataRouter } from './serverModules/ImageDataRouter.mjs';
import { UserCollectionsRouter } from './serverModules/UserCollectionsRouter.mjs';
import { receiveWebpageSocket, receiveProgramSocket } from './serverModules/serverSocket.mjs';
import consts from './consts.json' assert { type: 'json' };
import config from './config.json' assert { type: 'json' };

let sharedData = {
    database: null,
}
let webpageSocket = null;
let programSocket = null;

const app = express();
app.use(express.json());
app.use(express.static('webpage'));
app.use(cors({origin: '*'}));
app.use('/BattleLogs', BattleLogsRouter(sharedData));
app.use('/CharacterData', CharacterDataRouter(sharedData));
app.use('/ImageData', ImageDataRouter(sharedData));
app.use('/UserCollections', UserCollectionsRouter(sharedData));

const server = http.createServer(app);
const io = new SocketIOServer(server);  //server socket

connectToDb((error) => {
    if (!error) {
        //start server
        const port = consts.port;
        server.listen(port, '127.0.0.1', () => {
            console.log(`Listening on port ${port}\n`);
        });
        sharedData.database = getDb();
    }
})

app.get("/", (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    res.sendFile(path.join(__dirname, './webpage/index.html'));
})

app.get("/getToken", (req, res) => {
    let token = config.token;
    if (!token) {
        res.status(503).send({
            message: "error retrieving token from server"
        })
    }
    res.status(200).send({token: token});
});

io.on('connection', (socket) => {

    socket.on('identification', (data) => {
        switch (data.id) {
            case 'webpage':
                console.log('Webpage user connected to server');
                webpageSocket = socket;
                break;
            case 'program':
                console.log('Program connected to server');
                programSocket = socket;
                break;
            default:
                console.log(`Unrecognized socket ID ${socket.id}`);
        }

        if (webpageSocket !== null && programSocket !== null) {
            receiveWebpageSocket(webpageSocket, programSocket);
            receiveProgramSocket(programSocket, webpageSocket);
        }
    });

});