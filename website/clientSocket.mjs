//code for the client to handle receiving data on the websocket
import { createPartyFlexBox, createSuggestionFlexBox } from './createFlexBoxes.mjs'

const socket = io(`http://127.0.0.1:2700`);
let tabsToDelete = [];

console.log('Establishing websocket connection to the server...');

socket.on('connect', () => {
    console.log('Connected to the server!');
    if (document.getElementById('Home-button') === null) {
        createTab("Home");
        const homeButton = document.getElementById('Home-button');
        const homeContent = document.getElementById('Home-content');
        const programInformation = document.createElement('div');
        programInformation.innerHTML = "This is a program that tracks gacha battles in real time, updates boosts and statuses, calculates stats, and suggests moves.<br>Click on a tab to view move suggestions for that battle.";
        homeContent.appendChild(programInformation);
        homeButton.click();
    }
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
    const message = `<a href=${data.link} target="_blank">${data.battleKey}</a> started`;
    addToHome(data.time, message);
});

socket.on('playerParty', (data) => {
    addPlayerParty(data.battleObj, data.battleKey, data.playerName, data.hasStrength, data.supportBonus, data.partyArray);
});

socket.on('battleEnd', (data) => {
    addEmbed(data.battleKey, "<b>WINNER:</b>", data.turnResults, data.usernames);
    deleteTab(data.battleKey);
    const time = new Date().toLocaleString();
    addToHome(time, data.battleEndMessage);
});

socket.on('turnResults', (data) => {
    addEmbed(data.battleKey, `<b><u>Turn ${data.turn}</u></b>`, data.turnResults, data.usernames);
});

socket.on('suggestedMoves', (data) => {
    addSuggestedMoves(data.battleObj, data.battleKey, data.p1suggestionData, data.p2suggestionData, data.playerNumberToPrintFirst);
});

function setTabContentMaxHeight() {
    const activeTabContent = document.querySelector('.tab-content.active');
    if (activeTabContent === null) {
        return;
    }
    const windowHeight = window.innerHeight;
    const bannerHeight = document.getElementById('banner').offsetHeight;
    const tabButtonsContainerHeight = document.getElementById('tab-buttons-container').offsetHeight;
    const bodyBottomMargin = window.getComputedStyle(document.body).marginBottom;
    
    const activeTabAdditional = parseInt(window.getComputedStyle(activeTabContent).borderTopWidth)
                              + parseInt(window.getComputedStyle(activeTabContent).borderBottomWidth)
                              + parseInt(window.getComputedStyle(activeTabContent).paddingTop)
                              + parseInt(window.getComputedStyle(activeTabContent).paddingBottom)
    const newHeight = `calc(${windowHeight}px - ${bannerHeight}px - ${tabButtonsContainerHeight}px - ${bodyBottomMargin} - ${activeTabAdditional}px - 3px)`;
    activeTabContent.style.maxHeight = newHeight;
}

window.addEventListener('load', setTabContentMaxHeight);
window.addEventListener('resize', setTabContentMaxHeight);

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
    setTabContentMaxHeight();
    //scrolling to bottom of tab
    selectedTabContent.scrollTop = selectedTabContent.scrollHeight;
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
        battleInformation.innerHTML = `started at ${time}`;
        tabContent.appendChild(battleInformation);
    }
}

function deleteTab(battleKey, force=false) {
    const tabButton = document.getElementById(`${battleKey}-button`);
    const tabContent = document.getElementById(`${battleKey}-content`);
    const homeButton = document.getElementById('Home-button');

    if (tabButton && tabContent) {
        if (!tabButton.classList.contains('active')) {
            tabButton.remove();
            tabContent.remove();
            tabsToDelete = tabsToDelete.filter(key => key != battleKey);
        } else if (force) {
            tabButton.remove();
            tabContent.remove();
            tabsToDelete = tabsToDelete.filter(key => key != battleKey);
            homeButton.click();
        } else if (!tabsToDelete.includes(battleKey)) {
            tabsToDelete.push(battleKey);
        }
    }
}

function addToHome(time, message) {
    const homeContent = document.getElementById('Home-content');
    const newElement = document.createElement('div');
    newElement.classList.add('row');

    const timeDiv = document.createElement('div');
    let partialTime = time.slice(time.indexOf(", ") + 2);
    timeDiv.innerHTML = `<b style="margin-right: 30px">${partialTime}</b>`;

    const messageDiv = document.createElement('div');
    messageDiv.innerHTML = message;
    
    newElement.appendChild(timeDiv);
    newElement.appendChild(messageDiv);
    homeContent.appendChild(newElement);
}

function addPlayerParty(battleObj, battleKey, playerName, hasStrength, supportBonus, partyArray) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    if (tabContent === null) {
        return;
    }
    const partyFlexBox = createPartyFlexBox(battleObj, battleKey, playerName, hasStrength, supportBonus, partyArray);
    tabContent.appendChild(partyFlexBox);
}

function addEmbed(battleKey, header, body, usernames) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    if (tabContent === null) {
        return;
    }
    const newElement = document.createElement('div');
    newElement.classList.add('discord-embed');
    newElement.classList.add('turn-results-embed');
    newElement.innerHTML = `${header}\n${body}`
                           .replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
                           .replace(/\n/g, '<br>')
                           .replace(/<@(\d+)>/g, (match, playerID) => `<div class="ping">@${usernames[playerID]}</div>`);
    tabContent.appendChild(newElement);
}

function addSuggestedMoves(battleObj, battleKey, p1suggestionData, p2suggestionData, playerNumberToPrintFirst) {
    const tabContent = document.getElementById(`${battleKey}-content`);
    if (tabContent === null) {
        return;
    }
    const p1suggestion = createSuggestionFlexBox(battleObj, battleKey, p1suggestionData);
    const p2suggestion = createSuggestionFlexBox(battleObj, battleKey, p2suggestionData);
    if (playerNumberToPrintFirst == 1) {
        tabContent.appendChild(p1suggestion);
        tabContent.appendChild(p2suggestion);
    } else {
        tabContent.appendChild(p2suggestion);
        tabContent.appendChild(p1suggestion);
    }
}