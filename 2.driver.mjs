//run this with $ node 2.driver.mjs
//must have 1.server.js running

import { promises as fs } from 'fs';
import path from 'path';
import { startWsConnection } from "./driverModules/websocket.mjs";

(async ()=> {
    await deleteAllFilesInDirectory('currentBattles');
    let battleObj = {
        currentBattles: [],
        usernames: {},
        inputs: {}
    };
    startWsConnection(battleObj);
})();

async function deleteAllFilesInDirectory(directoryPath) {
    try {
        const files = await fs.readdir(directoryPath);
        const deletePromises = files.map(async (file) => {
            const filePath = path.join(directoryPath, file);
            await fs.unlink(filePath);
        });
        await Promise.all(deletePromises);
    } catch (err) {
        console.error(`Error deleting files in ${directoryPath}:`, err);
    }
}