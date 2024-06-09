// Start a websocket connection.

import ReconnectingWebSocket from 'reconnecting-websocket';
import WS from 'ws';
import { handleWsData } from './handleWsData.mjs';
import config from '../config.json' assert { type: 'json' };

const delay = async (ms = 1000) =>  new Promise(resolve => setTimeout(resolve, ms));

const options = {
    WebSocket: WS, // custom WebSocket constructor
    connectionTimeout: 10000,
    maxRetries: 20,
};

export function startWsConnection(battleObj) {
    //make sure server is running
    fetch("http://127.0.0.1:2500");
    
    let socket = new ReconnectingWebSocket('wss://gateway.discord.gg/?v=9&encoding=json', [], options);
    let seqNum;
    let interval;
    let connected = false;

    //make initial websocket connection
    socket.addEventListener('open', () => {
        console.log(`Connected to Discord gateway at ${new Date().toLocaleString()}\n`);
        socket.send(JSON.stringify({
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
    socket.addEventListener('message', (response) => {
        const responseJSON = JSON.parse(response.data);
        const opcode = responseJSON.op;
        switch (opcode) {
            case 0:
                handleWsData(battleObj, responseJSON);    
                break;
            case 1:
                socket.send(JSON.stringify({
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

    socket.addEventListener('close', (evt) => {
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
                socket.send(JSON.stringify({
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