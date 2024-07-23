//functions for the server socket to handle receiving data from a client socket

export function receiveWebpageSocket(webpageSocket, programSocket) {
    webpageSocket.on('newSuggestion', (data) => {
        programSocket.emit('newSuggestion', data);
    });

    webpageSocket.on('disconnect', () => {
        console.log('Webpage user disconnected from the server');
    });
}

export function receiveProgramSocket(programSocket, webpageSocket) {
    programSocket.on('battleStart', (data) => {
        webpageSocket.emit('battleStart', data);
    });

    programSocket.on('playerParty', (data) => {
        webpageSocket.emit('playerParty', data);
    });

    programSocket.on('battleEnd', (data) => {
        webpageSocket.emit('battleEnd', data);
    });

    programSocket.on('turnResults', (data) => {
        webpageSocket.emit('turnResults', data);
    });

    programSocket.on('suggestedMoves', (data) => {
        webpageSocket.emit('suggestedMoves', data);
    });

    programSocket.on('disconnect', () => {
        console.log('Program disconnected from the server');
    });
}