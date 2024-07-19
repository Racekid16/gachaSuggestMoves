//function for handling receiving data from a client socket

export function serverSocketReceive(socket) {
    console.log('User connected');

    socket.on('disconnect', () => {
        console.log('User disconnected');
    });

}