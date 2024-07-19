//functions for creating tables

export function createPartyFlexBox(battleObj, battleKey, playerName, hasStrength, supportBonus, partyArray) {
    const partyContainer = document.createElement('div');
    partyContainer.classList.add('row');

    const partyEmbed = createPartyEmbed(battleKey, playerName, supportBonus);
    const partyStats = createPartyStats(battleObj, battleKey, playerName, hasStrength, partyArray);

    partyContainer.appendChild(partyEmbed);
    partyContainer.appendChild(partyStats);
    return partyContainer;
}

export function createSuggestionFlexBox(battleObj, battleKey, playerSuggestionData) {
    const suggestionContainer = document.createElement('div');
    suggestionContainer.classList.add('row');
    suggestionContainer.classList.add('suggestion');

    const suggestionLabel = createSuggestionLabel(battleKey, playerSuggestionData);
    const suggestionContent = createSuggestionContent(battleObj, battleKey, playerSuggestionData);

    suggestionContainer.appendChild(suggestionLabel);
    suggestionContainer.appendChild(suggestionContent);
    return suggestionContainer;
}

function createPartyEmbed(battleKey, playerName, supportBonus) {
    //const playerID = battleObj[battleKey][playerName].id;

    const partyEmbed = document.createElement('div');
    partyEmbed.classList.add('discord-embed');
    partyEmbed.classList.add('party-embed');

    const partyHeader = document.createElement('div');
    partyHeader.classList.add('row');
    partyHeader.classList.add('party-header');

    const avatar = document.createElement('img');
    avatar.classList.add('party-avatar');
    avatar.src = `./battleAssets/${battleKey}/${playerName}/avatar.png`;
    avatar.alt = `${playerName}_avatar.png`;

    const partyPlayer = document.createElement('div');
    partyPlayer.innerHTML = `<b>${playerName}'s party</b>`;

    const supportBonusContainer = document.createElement('div');
    supportBonusContainer.classList.add('support-bonus-container');
    supportBonusContainer.innerHTML = `<b>Support Bonus: ${supportBonus}%</b>`;

    const partyImage = document.createElement('img');
    partyImage.classList.add('party-image');
    partyImage.src = `./battleAssets/${battleKey}/${playerName}/party.png`;
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
        numStarsCell.classList.add('cell');
        numStarsCell.innerHTML = `${partyArray[i].numStars}⭐`;
        activeCharStatsGrid.appendChild(numStarsCell);

        const charNameCell = document.createElement('div');
        charNameCell.classList.add('cell');
        charNameCell.innerHTML = `${charName}`;
        activeCharStatsGrid.appendChild(charNameCell);

        for (let stat of ['initiative', 'mental', 'physical', 'social', 'resolve']) {
            const newCell = document.createElement('div');
            newCell.classList.add('cell');
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
        numStarsCell.classList.add('cell');
        numStarsCell.innerHTML = `${partyArray[i].numStars}⭐`;
        benchCharStatsGrid.appendChild(numStarsCell);

        const charNameCell = document.createElement('div');
        charNameCell.classList.add('cell');
        charNameCell.innerHTML = `${charName}`;
        benchCharStatsGrid.appendChild(charNameCell);

        let supportCategory = battleObj[battleKey][playerName].chars[charName].supportCategory;
        supportCategory = supportCategory.charAt(0).toLowerCase() + supportCategory.slice(1);
        const supportCategoryCell = document.createElement('div');
        supportCategoryCell.classList.add('cell');
        supportCategoryCell.innerHTML = `${statSymbols[supportCategory]}`;
        benchCharStatsGrid.appendChild(supportCategoryCell);
        
        const supportBonus = battleObj[battleKey][playerName].chars[charName].supportBonus;
        const supportBonusCell = document.createElement('div');
        supportBonusCell.classList.add('cell');
        supportBonusCell.innerHTML = `+${supportBonus}%`;
        benchCharStatsGrid.appendChild(supportBonusCell);

        for (let j = 0; j < 3; j++) {
            const newCell = document.createElement('div');
            newCell.classList.add('cell');
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
    
    const suggestionLabel = document.createElement('div');
    suggestionLabel.classList.add('suggestion-label');

    const avatar = document.createElement('img');
    avatar.classList.add('suggestion-avatar');
    avatar.src = `./battleAssets/${battleKey}/${playerName}/avatar.png`;
    avatar.alt = `${playerName}_avatar.png`;

    const suggestionPlayer = document.createElement('div');
    suggestionPlayer.classList.add('suggestion-player');
    suggestionPlayer.innerHTML = `<b>${playerName}</b>`;

    suggestionLabel.appendChild(avatar);
    suggestionLabel.appendChild(suggestionPlayer);
    return suggestionLabel;
}

function createSuggestionContent(battleObj, battleKey, playerSuggestionData) {
    const suggestionContent = document.createElement('div');
    suggestionContent.classList.add('suggestion-content');
    
    const charStats = createSuggestionCharStats(battleObj, battleKey, playerSuggestionData);
    const charOtherInformation = createCharOtherInformation();
    const suggestedMoveContainer = createSuggestedMoveContainer(battleObj, battleKey, playerSuggestionData);

    suggestionContent.appendChild(charStats);
    suggestionContent.appendChild(charOtherInformation);
    suggestionContent.appendChild(suggestedMoveContainer);
    return suggestionContent;
}

function createSuggestionCharStats(battleObj, battleKey, playerSuggestionData) {
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
    const imageName = battleObj[battleKey][playerName].chars[charName].imageName;

    const charStats = document.createElement('div');
    charStats.classList.add('row');
    charStats.classList.add('char-stats');

    if (rune !== null) {
        const runeImage = document.createElement('img');
        runeImage.classList.add('rune-image');
        runeImage.src = `./images/runes/${rune}.png`;
        charStats.appendChild(runeImage);
    }

    const charImage = document.createElement('img');
    charImage.classList.add('char-image');
    charImage.src = `./battleAssets/${battleKey}/${playerName}/chars/${imageName}`;
    charStats.appendChild(charImage);

    const charNameContainer = document.createElement('div');
    charNameContainer.innerHTML = `<b>${charName}</b>`;
    charStats.appendChild(charNameContainer);

    for (let stat of ['initiative', 'mental', 'physical', 'social', 'resolve']) {
        const newElement = document.createElement('div');
        const statSymbol = statSymbols[stat];
        const statValue = battleObj[battleKey][playerName].chars[charName][stat];
        newElement.innerHTML = `${statSymbol}<b>${statValue}</b>`;
        charStats.appendChild(newElement);
    }
    
    return charStats;
}

function createCharOtherInformation() {
    const charOtherInformation = document.createElement('div');
    charOtherInformation.classList.add('row');
    charOtherInformation.classList.add('char-other-information');

    //TODO...

    return charOtherInformation;
}

function createSuggestedMoveContainer(battleObj, battleKey, playerSuggestionData) {
    const suggestedMoveSequence = playerSuggestionData.moveSequence;
    const suggestedMove = suggestedMoveSequence[0];
    const suggestedMoveObj = playerSuggestionData.moves.find(moveObj => moveObj.name == suggestedMove);
    const playerCanUseSuggestedMove = typeof suggestedMoveObj !== 'undefined';
    
    const suggestedMoveContainer = document.createElement('div');
    suggestedMoveContainer.classList.add('suggested-move-container');
    suggestedMoveContainer.innerHTML = `Recommended move:`
    if (playerCanUseSuggestedMove) {
        suggestedMoveContainer.innerHTML += ` <b>${suggestedMove}</b>`;
        if (suggestedMoveObj.lowerBound > 0) {
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
    }

    return suggestedMoveContainer;
}