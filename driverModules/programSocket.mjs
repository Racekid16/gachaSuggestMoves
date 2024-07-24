//code for the program to handle receiving data on the program socket
import { io } from 'socket.io-client';
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
        battleObj[data.battleKey][data.playerName].chars[data.charName].rune = data.rune;
        let [p1name, p2name] = data.battleKey.split(" vs. ");
        battleObj[data.battleKey].log(`Rune of ${data.rune} added to ${data.playerName}'s ${data.charName}`);
        suggestMoves(battleObj, programSocket, p1name, p2name, data.p1char, data.p2char, data.turn);
    });

    return programSocket;
}