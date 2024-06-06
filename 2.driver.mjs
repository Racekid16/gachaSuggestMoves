//run this with $ node 2.driver.mjs
//must have 1.server.js running

import { startWsConnection } from "./utilities/websocket.mjs";

let battleObj = {};
startWsConnection(battleObj);