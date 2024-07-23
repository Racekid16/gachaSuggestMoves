//functions for creating some larger elements with many components

export function createPartyContainer(battleObj, battleKey, playerName, hasStrength, supportBonus, partyArray) {
    const partyContainer = document.createElement('div');
    partyContainer.classList.add('row');

    const partyEmbed = createPartyEmbed(battleKey, playerName, supportBonus);
    const partyStats = createPartyStats(battleObj, battleKey, playerName, hasStrength, partyArray);

    partyContainer.appendChild(partyEmbed);
    partyContainer.appendChild(partyStats);
    return partyContainer;
}

export function createSuggestionContainer(battleObj, webpageSocket, battleKey, turn, playerSuggestionData) {
    const playerName = playerSuggestionData.playerName;
    const charName = playerSuggestionData.charName;

    const suggestionContainer = document.createElement('div');
    suggestionContainer.classList.add('row');
    suggestionContainer.classList.add('suggestion-container');
    // note: node attributes can only be lowercase strings
    suggestionContainer.setAttribute('playername', playerName);
    suggestionContainer.setAttribute('charname', charName);
    suggestionContainer.setAttribute('turn', turn);

    const suggestionLabel = createSuggestionLabel(battleKey, playerSuggestionData);
    const suggestionContent = createSuggestionContent(battleObj, webpageSocket, battleKey, turn, playerSuggestionData);

    suggestionContainer.appendChild(suggestionLabel);
    suggestionContainer.appendChild(suggestionContent);
    return suggestionContainer;
}

function createPartyEmbed(battleKey, playerName, supportBonus) {
    //const playerID = battleObj[battleKey][playerName].id;
    const encodedBattleKey = battleKey.replace(/\//g, 'slash');
    const encodedPlayerName = playerName.replace(/\//g, 'slash');

    const partyEmbed = document.createElement('div');
    partyEmbed.classList.add('discord-embed');
    partyEmbed.classList.add('party-embed');

    const partyHeader = document.createElement('div');
    partyHeader.classList.add('row');
    partyHeader.classList.add('party-header');

    const avatar = document.createElement('img');
    avatar.classList.add('party-avatar');
    avatar.src = `./battleAssets/${encodedBattleKey}/${encodedPlayerName}/avatar.png`;
    avatar.alt = `${playerName}_avatar.png`;

    const partyPlayer = document.createElement('div');
    partyPlayer.innerHTML = `<b>${playerName}'s party</b>`;

    const supportBonusContainer = document.createElement('div');
    supportBonusContainer.classList.add('support-bonus-container');
    supportBonusContainer.innerHTML = `<b>Support Bonus: ${supportBonus}%</b>`;

    const partyImage = document.createElement('img');
    partyImage.classList.add('party-image');
    partyImage.src = `./battleAssets/${encodedBattleKey}/${encodedPlayerName}/party.png`;
    partyImage.alt = `${playerName}_party.png`;

    partyHeader.appendChild(avatar);
    partyHeader.appendChild(partyPlayer);
    partyEmbed.appendChild(partyHeader);
    partyEmbed.appendChild(supportBonusContainer);
    partyEmbed.appendChild(partyImage);
    return partyEmbed;
}

function createPartyStats(battleObj, battleKey, playerName, hasStrength, partyArray) {
    const partyStats = document.createElement('div');

    const statSymbols = {
        "initiative": "🏃",
        "mental": "🧠",
        "physical": "💪",
        "social": "🗣️",
        "resolve": "❤️",
        "ability": "🏃🧠💪🗣️"
    }

    const activeHeader = document.createElement('div');
    activeHeader.innerHTML = "<b>Active</b>";
    if (hasStrength) {
        activeHeader.innerHTML += " (Strength 3: 🏃🧠💪🗣️❤️ +10%)";
    }

    const activeCharStatsGrid = createactiveCharStatsGrid(battleObj, battleKey, playerName, partyArray, statSymbols);

    const benchHeader = document.createElement('div');
    benchHeader.innerHTML = '<b>Bench</b>'

    const benchCharStatsGrid = createBenchCharStatsGrid(battleObj, battleKey, playerName, partyArray, statSymbols); 

    partyStats.appendChild(activeHeader);
    partyStats.appendChild(activeCharStatsGrid);
    partyStats.appendChild(benchHeader);
    partyStats.appendChild(benchCharStatsGrid);
    return partyStats;
}

function createactiveCharStatsGrid(battleObj, battleKey, playerName, partyArray, statSymbols) {
    const activeCharStatsGrid = document.createElement('div');
    activeCharStatsGrid.classList.add('party-stats-grid');
    for (let i = 0; i < 3; i++) {
        const charName = partyArray[i].name;
        if (charName == "empty") {
            continue;
        }

        const numStarsCell = document.createElement('div');
        numStarsCell.classList.add('party-cell');
        numStarsCell.innerHTML = `${partyArray[i].numStars}⭐`;
        activeCharStatsGrid.appendChild(numStarsCell);

        const charNameCell = document.createElement('div');
        charNameCell.classList.add('party-cell');
        charNameCell.innerHTML = `${charName}`;
        activeCharStatsGrid.appendChild(charNameCell);

        for (let stat of ['initiative', 'mental', 'physical', 'social', 'resolve']) {
            const newCell = document.createElement('div');
            newCell.classList.add('party-cell');
            newCell.innerHTML = `${statSymbols[stat]}${battleObj[battleKey][playerName].chars[charName][stat]}`;
            activeCharStatsGrid.appendChild(newCell);
        }
    }
    return activeCharStatsGrid;
}

function createBenchCharStatsGrid(battleObj, battleKey, playerName, partyArray, statSymbols) {
    const benchCharStatsGrid = document.createElement('div');
    benchCharStatsGrid.classList.add('party-stats-grid');
    for (let i = 3; i < 6; i++) {
        const charName = partyArray[i].name;
        if (charName == "empty") {
            continue;
        }

        const numStarsCell = document.createElement('div');
        numStarsCell.classList.add('party-cell');
        numStarsCell.innerHTML = `${partyArray[i].numStars}⭐`;
        benchCharStatsGrid.appendChild(numStarsCell);

        const charNameCell = document.createElement('div');
        charNameCell.classList.add('party-cell');
        charNameCell.innerHTML = `${charName}`;
        benchCharStatsGrid.appendChild(charNameCell);

        let supportCategory = battleObj[battleKey][playerName].chars[charName].supportCategory;
        supportCategory = supportCategory.charAt(0).toLowerCase() + supportCategory.slice(1);
        const supportCategoryCell = document.createElement('div');
        supportCategoryCell.classList.add('party-cell');
        supportCategoryCell.innerHTML = `${statSymbols[supportCategory]}`;
        benchCharStatsGrid.appendChild(supportCategoryCell);
        
        const supportBonus = battleObj[battleKey][playerName].chars[charName].supportBonus;
        const supportBonusCell = document.createElement('div');
        supportBonusCell.classList.add('party-cell');
        supportBonusCell.innerHTML = `+${supportBonus}%`;
        benchCharStatsGrid.appendChild(supportBonusCell);

        for (let j = 0; j < 3; j++) {
            const newCell = document.createElement('div');
            newCell.classList.add('party-cell');
            const activeCharName = partyArray[j].name;
            if (activeCharName == "empty") {
                benchCharStatsGrid.appendChild(newCell);
                continue;
            }
            
            for (let ally of battleObj[battleKey][playerName].chars[charName].allies) {
                if (battleObj[battleKey][playerName].chars[activeCharName].tags.includes(ally)) {
                    newCell.innerHTML = activeCharName;
                }
            }
            benchCharStatsGrid.appendChild(newCell);
        }
    }
    return benchCharStatsGrid;
}

function createSuggestionLabel(battleKey, playerSuggestionData) {
    const playerName = playerSuggestionData.playerName;
    const encodedBattleKey = battleKey.replace(/\//g, 'slash');
    let encodedPlayerName = playerName.replace(/\//g, 'slash');
    
    const suggestionLabel = document.createElement('div');
    suggestionLabel.classList.add('suggestion-label');

    const avatar = document.createElement('img');
    avatar.classList.add('suggestion-avatar');
    avatar.src = `./battleAssets/${encodedBattleKey}/${encodedPlayerName}/avatar.png`;
    avatar.alt = `${playerName}_avatar.png`;

    const suggestionPlayer = document.createElement('div');
    suggestionPlayer.classList.add('suggestion-player');
    suggestionPlayer.innerHTML = `<b>${playerName}</b>`;

    suggestionLabel.appendChild(avatar);
    suggestionLabel.appendChild(suggestionPlayer);
    return suggestionLabel;
}

function createSuggestionContent(battleObj, webpageSocket, battleKey, turn, playerSuggestionData) {
    const suggestionContent = document.createElement('div');
    suggestionContent.classList.add('suggestion-content');
    
    const charStats = createSuggestionCharStats(battleObj, webpageSocket, battleKey, turn, playerSuggestionData);
    const charOtherInformation = createCharOtherInformation(playerSuggestionData);
    const suggestedMoveContainer = createSuggestedMoveContainer(playerSuggestionData);

    suggestionContent.appendChild(charStats);
    suggestionContent.appendChild(charOtherInformation);
    suggestionContent.appendChild(suggestedMoveContainer);
    return suggestionContent;
}

function createSuggestionCharStats(battleObj, webpageSocket, battleKey, turn, playerSuggestionData) {
    const statSymbols = {
        "initiative": "🏃",
        "mental": "🧠",
        "physical": "💪",
        "social": "🗣️",
        "resolve": "❤️",
        "ability": "🏃🧠💪🗣️"
    }

    const playerName = playerSuggestionData.playerName;
    const charName = playerSuggestionData.charName;
    const rune = battleObj[battleKey][playerName].chars[charName].rune;

    const charStats = document.createElement('div');
    charStats.classList.add('row');
    charStats.classList.add('char-stats');

    if (rune !== null) {
        const runeImage = document.createElement('img');
        runeImage.classList.add('rune-image');
        runeImage.src = `./images/runes/${rune}.png`;
        charStats.appendChild(runeImage);
    }

    const charSelectContainer = createCharSelectContainer(battleObj, webpageSocket, battleKey, playerName, charName, turn);
    charStats.appendChild(charSelectContainer);

    for (let stat of ['initiative', 'mental', 'physical', 'social', 'resolve']) {
        const newElement = document.createElement('div');
        newElement.classList.add('char-stat');
        const statSymbol = statSymbols[stat];
        const statValue = battleObj[battleKey][playerName].chars[charName][stat];
        newElement.innerHTML = `${statSymbol}<b>${statValue}</b>`;
        charStats.appendChild(newElement);
    }
    
    return charStats;
}

function createCharSelectContainer(battleObj, webpageSocket, battleKey, playerName, charName, turn) {
    const charSelectContainer = document.createElement('div');
    charSelectContainer.classList.add('char-select-container');

    const charSelectButton = createCharButton(battleObj, battleKey, playerName, charName);

    const charSelectOptions = document.createElement('div');
    charSelectOptions.classList.add('char-select-options');

    const otherChars = Object.keys(battleObj[battleKey][playerName].chars).filter(charKey => charKey != charName && battleObj[battleKey][playerName].chars[charKey].resolve > 0);
    for (let charKey of otherChars) {
        const charOption = createCharButton(battleObj, battleKey, playerName, charKey);

        charOption.onclick = () => {
            const [p1name, p2name] = battleKey.split(" vs. ");
            let p1char;
            let p2char;
            const tabContent = document.getElementById(`${battleKey}-content`);
            const thisTurnSuggestions = tabContent.querySelectorAll(`.suggestion-container[turn="${turn}"]`);
            thisTurnSuggestions.forEach(suggestionContainer => {
                let thisSuggestionPlayer = suggestionContainer.getAttribute('playername');
                let thisSuggestionChar = suggestionContainer.getAttribute('charname');
                if (thisSuggestionPlayer == p1name) {
                    if (playerName == p1name) {
                        p1char = charKey;
                    } else {
                        p1char = thisSuggestionChar;
                    }
                }
                if (thisSuggestionPlayer == p2name) {
                    if (playerName == p2name) {
                        p2char = charKey;
                    } else {
                        p2char = thisSuggestionChar;
                    }
                }
                suggestionContainer.remove();
            });
            webpageSocket.emit('newSuggestion', {   
                p1name: p1name,
                p2name: p2name,
                p1char: p1char,
                p2char: p2char,
                turn: turn
            });
        }

        charSelectOptions.appendChild(charOption);
    }

    if (otherChars.length == 0) {
        charSelectButton.classList.remove('char-button');
    } else {
        charSelectButton.onclick = () => {
            charSelectOptions.style.display = charSelectOptions.style.display == 'flex' ? 'none' : 'flex';
        };
    }

    // hide select options if click outside the select menu
    document.addEventListener('click', (event) => {
        if (!charSelectButton.contains(event.target) && !charSelectOptions.contains(event.target)) {
            charSelectOptions.style.display = 'none';
        }
    });

    charSelectContainer.appendChild(charSelectButton);
    charSelectContainer.appendChild(charSelectOptions);
    return charSelectContainer;
}

function createCharButton(battleObj, battleKey, playerName, charName) {
    const charButton = document.createElement('div');
    charButton.classList.add('row');
    charButton.classList.add('char-button');

    const encodedBattleKey = battleKey.replace(/\//g, 'slash');
    const encodedPlayerName = playerName.replace(/\//g, 'slash');
    const imageName = battleObj[battleKey][playerName].chars[charName].imageName;

    const charImage = document.createElement('img');
    charImage.classList.add('char-image');
    charImage.src = `./battleAssets/${encodedBattleKey}/${encodedPlayerName}/chars/${imageName}`;

    const charNameContainer = document.createElement('div');
    charNameContainer.classList.add('char-stat');
    charNameContainer.innerHTML = `<b>${charName}</b>`;

    charButton.appendChild(charImage);
    charButton.appendChild(charNameContainer);
    return charButton;
}

function createCharOtherInformation(playerSuggestionData) {
    const charOtherInformation = document.createElement('div');
    charOtherInformation.classList.add('row');
    charOtherInformation.classList.add('char-other-information');

    for (let listName of ['buffs', 'positiveStatuses', 'debuffs', 'negativeStatuses']) {
        const list = playerSuggestionData[listName];
        if (list.length > 0) {
            const listContainer = createListContainer(listName, list);
            charOtherInformation.appendChild(listContainer);
        }
    }

    const movesList = playerSuggestionData.moves;
    const movesListContainer = createMovesListContainer(movesList);

    charOtherInformation.appendChild(movesListContainer);
    return charOtherInformation;
}

function createListContainer(listName, list) {
    let labelColor;
    switch (listName) {
        case 'buffs':
            listName = "Buffs";
            labelColor = 'lightgreen';
            break;
        case 'positiveStatuses':
            listName = 'Positive Statuses';
            labelColor = 'lightgreen';
            break;
        case 'debuffs':
            listName = 'Debuffs';
            labelColor = 'lightcoral';
            break;
        case 'negativeStatuses':
            listName = "Negative Statuses";
            labelColor = 'lightcoral';
            break;
    }

    const listContainer = document.createElement('div');
    listContainer.classList.add('list-container');

    const listLabel = document.createElement('div');
    listLabel.classList.add('list-label');
    listLabel.style.backgroundColor = labelColor;
    listLabel.innerHTML = `<b>${listName}</b>`;

    const listContent = document.createElement('div');
    listContent.classList.add('list-content');
    for (let item of list) {
        for (let property in item) {
            const cellValue = item[property];

            const cell = document.createElement('div');
            cell.classList.add('list-cell');
            cell.innerHTML = cellValue;

            listContent.appendChild(cell);
        }
    }

    listContainer.appendChild(listLabel);
    listContainer.appendChild(listContent);
    return listContainer;
}

function createMovesListContainer(moves) {
    const movesListContainer = document.createElement('div');
    movesListContainer.classList.add('list-container');

    const movesListLabel = document.createElement('div');
    movesListLabel.classList.add('list-label');
    movesListLabel.style.backgroundColor = 'lightblue';
    movesListLabel.innerHTML = "<b>Moves</b>";
    movesListContainer.appendChild(movesListLabel);

    const movesListContent = document.createElement('div');
    movesListContent.classList.add('list-content');
    movesListContent.classList.add('moves-list-content');
    for (let moveObj of moves) {
        const moveName = moveObj.name;
        const lowerBound = moveObj.lowerBound;
        const upperBound = moveObj.upperBound;
        const hitType = moveObj.hitType;
        const isFatal = moveObj.isFatal;

        const nameCell = document.createElement('div');
        nameCell.classList.add('list-cell');
        nameCell.innerHTML = moveName;
        movesListContent.appendChild(nameCell);

        if (upperBound > 0) {
            const lowerBoundCell = document.createElement('div');
            lowerBoundCell.classList.add('list-cell');
            lowerBoundCell.innerHTML = lowerBound;
            movesListContent.appendChild(lowerBoundCell);

            const dashCell = document.createElement('div');
            //not adding cell so that it has no padding
            dashCell.innerHTML = '-';
            movesListContent.appendChild(dashCell);

            const upperBoundCell = document.createElement('div');
            upperBoundCell.classList.add('list-cell');
            upperBoundCell.innerHTML = upperBound;
            movesListContent.appendChild(upperBoundCell);

            const hitTypeCell = document.createElement('div');
            if (hitType != "") {
                hitTypeCell.classList.add('list-cell');
                hitTypeCell.innerHTML = hitType;
            }
            movesListContent.appendChild(hitTypeCell);

            const isFatalCell = document.createElement('div');
            if (isFatal != false) {
                isFatalCell.classList.add('list-cell');
                isFatalCell.innerHTML = 'FATAL';
            }
            movesListContent.appendChild(isFatalCell);
        } else {
            for (let i = 0; i < 5; i++) {
                const emptyCell = document.createElement('div');
                movesListContent.appendChild(emptyCell);
            }
        }
    }

    movesListContainer.appendChild(movesListLabel);
    movesListContainer.appendChild(movesListContent);
    return movesListContainer;
}

function createSuggestedMoveContainer(playerSuggestionData) {
    const suggestedMoveSequence = playerSuggestionData.moveSequence;
    const suggestedMove = suggestedMoveSequence[0];
    const suggestedMoveObj = playerSuggestionData.moves.find(moveObj => moveObj.name == suggestedMove);
    const playerCanUseSuggestedMove = typeof suggestedMoveObj !== 'undefined';
    
    const suggestedMoveContainer = document.createElement('div');
    //suggestedMoveContainer.classList.add('suggested-move-container');
    suggestedMoveContainer.innerHTML = `Recommended move:`
    if (playerCanUseSuggestedMove) {
        suggestedMoveContainer.innerHTML += ` <b>${suggestedMove}</b>`;
        if (suggestedMoveObj.upperBound > 0) {
            suggestedMoveContainer.innerHTML += ` (${suggestedMoveObj.lowerBound} - ${suggestedMoveObj.upperBound})`;
            if (suggestedMoveObj.hitType != "") {
                suggestedMoveContainer.innerHTML += ` ${suggestedMoveObj.hitType}`;
            }
            if (suggestedMoveObj.isFatal) {
                suggestedMoveContainer.innerHTML += ` FATAL`;
            }
        }
    }
    if (suggestedMoveSequence.length > 1) {
        suggestedMoveContainer.innerHTML += `<br>Move sequence: ${suggestedMoveSequence[0]}`;
        for (let i = 1; i < suggestedMoveSequence.length; i++) {
            suggestedMoveContainer.innerHTML += `, ${suggestedMoveSequence[i]}`;
        }
        suggestedMoveContainer.innerHTML += ` (${suggestedMoveSequence.length} moves)`
    }

    return suggestedMoveContainer;
}