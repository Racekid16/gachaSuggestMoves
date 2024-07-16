const socket = io(`http://127.0.0.1:2700`);

console.log('Client websocket is connecting to server...');

socket.on('connect', () => {
    console.log('Connected to the server!');
})

socket.on('disconnect', () => {
    console.log('Disconnected from the server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('new-data', (data) => {
    console.log('Received new data:', data);
    const contentDiv = document.getElementById('content');
    const newElement = document.createElement('div');
    newElement.textContent = JSON.stringify(data);
    contentDiv.appendChild(newElement);
});