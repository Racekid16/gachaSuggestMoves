const socket = io(`http://127.0.0.1:2700`);
let tabsToDelete = [];

console.log('Establishing websocket connection to the server...');

socket.on('connect', () => {
    console.log('Connected to the server!');
    updateHomeVisibility();
})

socket.on('disconnect', () => {
    console.log('Disconnected from the server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('battleStart', (data) => {
    createTab(data.battleKey, data.time, data.link);
    updateHomeVisibility();
});

socket.on('playerParty', (data) => {
    addPlayerParty(data.battleObj, data.battleKey, data.playerName, data.partyJSON, data.hasStrength);
});

socket.on('battleEnd', (data) => {
    deleteTab(data.battleKey);
    updateHomeVisibility();
});

socket.on('turnResults', (data) => {
    addTurnResults(data.battleKey, data.turn, data.turnResults);
});

socket.on('suggestedMoves', (data) => {
    addSuggestedMoves(data.battleKey, data.text);
});

function showTab(battleKey) {
    const selectedTab = document.getElementById(`${battleKey}-content`);
    let tabActive = selectedTab.classList.contains('active');
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.classList.remove('active');
    });
    if (!tabActive) {
        selectedTab.classList.add('active');
    }
    for (let key of tabsToDelete) {
        deleteTab(key);
    }
    updateHomeVisibility();
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

    if (tabButton && tabContent) {
        if (!tabContent.classList.contains('active')) {
            tabButton.remove();
            tabContent.remove();
        } else if (!tabsToDelete.includes(battleKey)) {
            tabsToDelete.push(battleKey);
        }
    }
}

function updateHomeVisibility() {
    const homeContent = document.getElementById('home-content');
    const numTabs = document.querySelectorAll('.tab-button').length;
    const activeTabs = document.querySelectorAll('.tab-content.active').length;
    if (activeTabs === 0) {
        homeContent.style.display = 'block';
        if (numTabs == 0) {
            homeContent.textContent = "A program that tracks gacha battles in real time, updates boosts and statuses, calculates stats, and suggests moves.\nClickable tabs representing battles will appear once a battle begins.";
        } else {
            homeContent.textContent = "A program that tracks gacha battles in real time, updates boosts and statuses, calculates stats, and suggests moves.\nClick on a tab to receive move suggestions for that battle.";
        }
    } else {
        homeContent.style.display = 'none';
    }
};


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