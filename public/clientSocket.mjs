//code for the client to handle receiving data on the websocket
import { createPartyFlexBox, createSuggestedMoveFlexBox } from './createFlexBoxes.mjs'

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
    const highQualityImageURL = data.imageURL.replace('format=png&width=328&height=254', "");
    addPlayerParty(data.battleObj, data.battleKey, data.playerName, data.hasStrength, data.partyJSON, highQualityImageURL);
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

function toggleTab(battleKey) {
    const selectedTabButton = document.getElementById(`${battleKey}-button`);
    const selectedTabContent = document.getElementById(`${battleKey}-content`);
    let tabActive = selectedTabButton.classList.contains('active');
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(tabButton => {
        tabButton.classList.remove('active');
    });
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tabContent => {
        tabContent.classList.remove('active');
    });
    if (!tabActive) {
        selectedTabButton.classList.add('active');
        selectedTabContent.classList.add('active');
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
    tabButton.onclick = () => toggleTab(battleKey);
    tabButtonsContainer.appendChild(tabButton);

    const tabContent = document.createElement('div');
    tabContent.id = `${battleKey}-content`;
    tabContent.className = 'tab-content';
    tabContent.innerHTML = `<h2><a href="${battleLink}" target="_blank">${battleKey}</a></h2>`;
    tabContentContainer.appendChild(tabContent);

    const battleInformation = document.createElement('div');
    battleInformation.innerHTML = `started at ${time}<br>`;
    tabContent.append(battleInformation);
}

function deleteTab(battleKey) {
    const tabButton = document.getElementById(`${battleKey}-button`);
    const tabContent = document.getElementById(`${battleKey}-content`);

    if (tabButton && tabContent) {
        if (!tabButton.classList.contains('active')) {
            tabButton.remove();
            tabContent.remove();
            tabsToDelete = tabsToDelete.filter(key => key != battleKey);
        } else if (!tabsToDelete.includes(battleKey)) {
            tabsToDelete.push(battleKey);
        }
    }
}

function updateHomeVisibility() {
    const homeContent = document.getElementById('home-content');
    const numTabs = document.querySelectorAll('.tab-button').length;
    const activeTabs = document.querySelectorAll('.tab-button.active').length;
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

function addPlayerParty(battleObj, battleKey, playerName, hasStrength, partyJSON, imageURL) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    const newElement = document.createElement('div');
    const partyLabel = document.createElement('div');

    if (!hasStrength) {
        partyLabel.innerHTML = `<b>${playerName}</b>'s party`
    } else {
        partyLabel.innerHTML = `<b>${playerName}</b>'s party (Strength 3: +10% to stats)`
    }    
    const partyTable = createPartyFlexBox(battleObj, battleKey, playerName, partyJSON, imageURL);

    newElement.appendChild(partyLabel);
    newElement.appendChild(partyTable);
    newElement.appendChild(document.createElement('br'));
    tabContent.appendChild(newElement);
}

function addTurnResults(battleKey, turn, turnResults) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    const newElement = document.createElement('div');
    newElement.innerHTML = `Turn ${turn}:\n${turnResults}`
                           .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                           .replace(/\n/g, '<br>')
                           + '<br><br>';
    tabContent.appendChild(newElement);
}

function addSuggestedMoves(battleKey, text) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    const newElement = document.createElement('div');
    newElement.innerHTML = text.replace(/\n/g, '<br>') + '<br><br>';
    tabContent.appendChild(newElement);
}