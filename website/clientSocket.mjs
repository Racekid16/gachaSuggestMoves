//code for the client to handle receiving data on the websocket
import { createPartyFlexBox, createSuggestedMoveFlexBox } from './createFlexBoxes.mjs'

const socket = io(`http://127.0.0.1:2700`);
let tabsToDelete = [];

console.log('Establishing websocket connection to the server...');

socket.on('connect', () => {
    console.log('Connected to the server!');
    createTab("Home");
    const homeButton = document.getElementById('Home-button');
    const homeContent = document.getElementById('Home-content');
    const programInformation = document.createElement('div');
    programInformation.innerHTML = "This is a program that tracks gacha battles in real time, updates boosts and statuses, calculates stats, and suggests moves.<br>Click on a tab to view move suggestions for that battle.";
    homeContent.appendChild(programInformation);
    homeButton.click();
})

socket.on('disconnect', () => {
    console.log('Disconnected from the server');
});

socket.on('connect_error', (error) => {
    console.error('Connection error:', error);
});

socket.on('battleStart', (data) => {
    deleteTab(data.battleKey, true);
    createTab(data.battleKey, data.time, data.link);
    addBattleStartToHome(data.battleKey, data.time, data.link);
});

socket.on('playerParty', (data) => {
    addPlayerParty(data.battleObj, data.battleKey, data.playerNumber, data.playerName, data.hasStrength, data.partyArray);
});

socket.on('battleEnd', (data) => {
    deleteTab(data.battleKey);
    addBattleEndToHome(data.battleEndMessage);
});

socket.on('turnResults', (data) => {
    addTurnResults(data.battleKey, data.turn, data.turnResults, data.usernames);
});

socket.on('suggestedMoves', (data) => {
    addSuggestedMoves(data.battleKey, data.text);
});

function toggleTab(battleKey) {
    const selectedTabButton = document.getElementById(`${battleKey}-button`);
    const selectedTabContent = document.getElementById(`${battleKey}-content`); 
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(tabButton => {
        tabButton.classList.remove('active');
    });
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(tabContent => {
        tabContent.classList.remove('active');
    });
    selectedTabButton.classList.add('active');
    selectedTabContent.classList.add('active');
    for (let key of tabsToDelete) {
        deleteTab(key);
    }
    scrollToBottom(battleKey);
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
    if (battleLink) {
        tabContent.innerHTML = `<h2><a href="${battleLink}" target="_blank">${battleKey}</a></h2>`;
    } else {
        tabContent.innerHTML = `<h2>${battleKey}</h2>`;
    }
    tabContentContainer.appendChild(tabContent);

    if (time) {
        const battleInformation = document.createElement('div');
        battleInformation.style.marginBottom = "20px";
        battleInformation.innerHTML = `started at ${time}`;
        tabContent.append(battleInformation);
    }
}

function deleteTab(battleKey, force=false) {
    const tabButton = document.getElementById(`${battleKey}-button`);
    const tabContent = document.getElementById(`${battleKey}-content`);

    if (tabButton && tabContent) {
        if (!tabButton.classList.contains('active') || force) {
            tabButton.remove();
            tabContent.remove();
            tabsToDelete = tabsToDelete.filter(key => key != battleKey);
        } else if (!tabsToDelete.includes(battleKey)) {
            tabsToDelete.push(battleKey);
        }
    }
}

function addBattleStartToHome(battleKey, time, battleLink) {
    const homeContent = document.getElementById('Home-content');
    const newElement = document.createElement('div');
    let partialTime = time.slice(time.indexOf(", ") + 2);
    newElement.innerHTML = `${partialTime}: <a href=${battleLink} target="_blank">${battleKey}</a> started`;
    homeContent.appendChild(newElement);
}

function addBattleEndToHome(battleEndMessage) {
    const homeContent = document.getElementById('Home-content');
    const newElement = document.createElement('div');
    let time = new Date().toLocaleString();
    let partialTime = time.slice(time.indexOf(", ") + 2);
    newElement.innerHTML = `${partialTime}: ${battleEndMessage}`;
    homeContent.appendChild(newElement);
}

function scrollToBottom(battleKey) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    tabContent.scrollTop = tabContent.scrollHeight;
}

function addPlayerParty(battleObj, battleKey, playerNumber, playerName, hasStrength, partyArray) {
    const tabContent = document.getElementById(`${battleKey}-content`); 
    const partyFlexBox = createPartyFlexBox(battleObj, battleKey, playerNumber, playerName, hasStrength, partyArray);
    tabContent.appendChild(partyFlexBox);
}

function addTurnResults(battleKey, turn, turnResults, usernames) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    const newElement = document.createElement('div');
    newElement.classList.add('discord-embed');
    newElement.classList.add('turn-results-embed');
    newElement.innerHTML = `<b><u>Turn ${turn}</u></b>\n${turnResults}`
                           .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                           .replace(/\n/g, '<br>')
                           .replace(/<@(\d+)>/g, (match, playerID) => `<div class="ping"> @${usernames[playerID]}</div>`);
    tabContent.appendChild(newElement);
}

function addSuggestedMoves(battleKey, text) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    const newElement = document.createElement('div');
    newElement.innerHTML = text.replace(/\n/g, '<br>');
    tabContent.appendChild(newElement);
}