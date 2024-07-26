//code for the program to handle receiving data on the program socket
import { io } from 'socket.io-client';
import { addRune } from './rune.mjs';
import { applyBoosts } from './updateBoosts.mjs';
import { applyStatuses } from './updateStatuses.mjs';
import { applyDamageModifiers } from './updateDamageModifiers.mjs';
import { suggestMoves } from './suggestMove.mjs';

export function createProgramSocket(battleObj) {
    let programSocket = io(`http://127.0.0.1:2700`);

    programSocket.on('connect', () => {
        programSocket.emit('identification', {
            id: 'program'
        });
    });

    programSocket.on('newSuggestion', (data) => {
        suggestMoves(battleObj, programSocket, data.p1name, data.p2name, data.p1char, data.p2char, data.turn);
    });

    programSocket.on('setRune', (data) => {
        addRune(battleObj, data.battleKey, data.playerName, data.charName, data.rune);
        applyBoosts(battleObj, data.battleKey, data.playerName);
        applyStatuses(battleObj, data.battleKey, data.playerName);
        applyDamageModifiers(battleObj, data.battleKey, data.playerName);
        let [p1name, p2name] = data.battleKey.split(" vs. ");
        suggestMoves(battleObj, programSocket, p1name, p2name, data.p1char, data.p2char, data.turn);
    });

    return programSocket;
}