/*
run this with $ node 2.driver.mjs
must have 1.server.js running
*/

import { promises as fs } from 'fs';
import path from 'path';
import { createProgramSocket } from './driverModules/programSocket.mjs';
import { createDiscordSocket } from "./driverModules/discordSocket.mjs";

(async ()=> {
    await deleteAllContents('./currentBattles');
    await deleteAllContents('./webpage/battleAssets');
    let battleObj = {
        currentBattles: [],
        usernames: {},
        avatars: {},
        inputs: {}
    };
    let programSocket = createProgramSocket(battleObj);
    createDiscordSocket(battleObj, programSocket);
})();

//got from chat GPT
async function deleteAllContents(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);
        
        for (const file of files) {
            const filePath = path.join(directoryPath, file);
            const stat = await fs.lstat(filePath);

            if (stat.isDirectory()) {
                await deleteAllContents(filePath);
                await fs.rmdir(filePath);
            } else {
                await fs.unlink(filePath);
            }
        }
        
    } catch (err) {
        console.error(`Error deleting contents of ${directoryPath}: ${err.message}`);
        throw err;
    }
}