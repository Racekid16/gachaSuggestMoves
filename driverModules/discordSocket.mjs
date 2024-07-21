// Start a websocket connection with Discord's server.

import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import { handleWsData } from './handleWsData.mjs';
import config from '../config.json' assert { type: 'json' };
import consts from '../consts.json' assert { type: 'json' };

const delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));

const options = {
    WebSocket: WS, // custom WebSocket constructor
    connectionTimeout: 10000,
    maxRetries: 20,
};

export function createDiscordSocket(battleObj, programSocket) {
    //make sure server is running
    fetch(`http://127.0.0.1:${consts.port}`);
    
    let discordSocket = new ReconnectingWebSocket('wss://gateway.discord.gg/?v=9&encoding=json', [], options);
    let seqNum;
    let interval;
    let connected = false;

    //make initial websocket connection
    discordSocket.addEventListener('open', () => {
        console.log(`Connected to Discord gateway at ${new Date().toLocaleString()}\n`);
        discordSocket.send(JSON.stringify({
            op: 2,
            d: {
                token: config.token,
                intents: 64002,
                properties: {
                    $os: 'linux',
                    $browser: 'my_library',
                    $device: 'my_library'
                }
            }
        }));
    });

    //handle recieving data
    discordSocket.addEventListener('message', (response) => {
        const responseJSON = JSON.parse(response.data);
        const opcode = responseJSON.op;
        switch (opcode) {
            case 0:
                handleWsData(battleObj, programSocket, responseJSON);    
                break;
            case 1:
                discordSocket.send(JSON.stringify({
                    op: 1,
                    d: {
                        token: config.token,
                        intents: 64002,
                        properties: {
                            $os: 'linux',
                            $browser: 'my_library',
                            $device: 'my_library'
                        }
                    }
                }));
                break;
            case 10:
                interval = responseJSON.d.heartbeat_interval - 2000;
                connected = true;
                break;
            default:
        }
        seqNum = responseJSON.s;
    });

    discordSocket.addEventListener('close', (evt) => {
        console.log(`Socket closed with code ${evt.code} at ${new Date().toLocaleString()}. Reconnecting...`);
    });

    //send heartbeat periodically to maintain connection
    (async () => {
        try {
            while (!connected) {
                await delay(500);
            }
            //console.log("interval is", interval);
            setInterval(() => {
                discordSocket.send(JSON.stringify({
                    op: 1,
                    d: seqNum
                }));
            }, interval);
            //console.log("ping sent. interval", interval);
        } catch (err) {
            console.log(err);
        }
    })();
}