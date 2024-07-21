//code for the program to handle receiving data on the program socket
import { io } from 'socket.io-client';

export function createProgramSocket(battleObj) {
    let programSocket = io(`http://127.0.0.1:2700`);

    programSocket.on('connect', () => {
        programSocket.emit('identification', {
            id: 'program'
        });
    });

    return programSocket;
}