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

socket.on('battleStart', (data) => {
    createTab(data.battleKey, data.time, data.link);
});

socket.on('playerParty', (data) => {
    addPlayerParty(data.battleObj, data.battleKey, data.playerName, data.partyJSON, data.hasStrength);
});

socket.on('battleEnd', (data) => {
    deleteTab(data.battleKey);
});

socket.on('turnResults', (data) => {
    addTurnResults(data.battleKey, data.turn, data.turnResults);
});

socket.on('suggestedMoves', (data) => {
    addSuggestedMoves(data.battleKey, data.text);
});

function showTab(battleKey) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    document.getElementById(`${battleKey}-content`).classList.add('active');
}

function createTab(battleKey, time, battleLink) {
    const tabButtonsContainer = document.getElementById('tab-buttons-container');
    const tabContentContainer = document.getElementById('tab-content-container');

    const tabButton = document.createElement('button');
    tabButton.className = 'tab-button';
    tabButton.id = `${battleKey}-button`
    tabButton.textContent = battleKey;
    tabButton.onclick = () => showTab(battleKey);
    tabButtonsContainer.appendChild(tabButton);

    const tabContent = document.createElement('div');
    tabContent.id = `${battleKey}-content`;
    tabContent.className = 'tab-content';
    tabContent.innerHTML = `<h2>${battleKey}</h2>`;
    tabContentContainer.appendChild(tabContent);
}

function deleteTab(battleKey) {
    const tabButton = document.getElementById(`${battleKey}-button`);
    const tabContent = document.getElementById(`${battleKey}-content`);

    if (tabButton) tabButton.remove();
    if (tabContent) tabContent.remove();
}

function addPlayerParty(battleObj, battleKey, playerName, partyJSON, hasStrength) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    const newElement = document.createElement('div');
    newElement.textContent = JSON.stringify(partyJSON);
    tabContent.appendChild(newElement);
}

function addTurnResults(battleKey, turn, turnResults) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    const newElement = document.createElement('div');
    newElement.textContent = `Turn ${turn}:\n${turnResults}`;
    tabContent.appendChild(newElement);
}

function addSuggestedMoves(battleKey, text) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    const newElement = document.createElement('div');
    newElement.textContent = text;
    tabContent.appendChild(newElement);
}