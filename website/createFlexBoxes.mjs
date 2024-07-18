//functions for creating tables

export function createPartyFlexBox(battleObj, battleKey, playerName, hasStrength, supportBonus, partyArray) {
    const partyContainer = document.createElement('div');
    partyContainer.style.height = "30%";
    partyContainer.classList.add('one-by-two');

    const partyEmbed = createPartyEmbed(battleObj, battleKey, playerName, supportBonus);
    const partyStats = createPartyStats(battleObj, battleKey, playerName, hasStrength, partyArray);

    partyContainer.appendChild(partyEmbed);
    partyContainer.appendChild(partyStats);
    return partyContainer
}

export function createSuggestedMoveFlexBox() {
    
}

function createPartyEmbed(battleObj, battleKey, playerName, supportBonus) {
    //const playerID = battleObj[battleKey][playerName].id;

    const partyEmbed = document.createElement('div');
    partyEmbed.classList.add('discord-embed');
    partyEmbed.classList.add('party-embed');

    const partyHeader = document.createElement('div');
    partyHeader.classList.add('one-by-two');
    partyHeader.classList.add('party-header');

    const avatar = document.createElement('img');
    avatar.src = `./battleAssets/${battleKey}/${playerName}/avatar.png`;
    avatar.alt = `${playerName}_avatar.png`;
    avatar.classList.add('avatar');
    partyHeader.appendChild(avatar);

    const partyLabel = document.createElement('div');
    partyLabel.innerHTML = `<b>${playerName}'s party</b>`;
    partyHeader.appendChild(partyLabel);

    const supportBonusContainer = document.createElement('div');
    supportBonusContainer.innerHTML = `<b>Support Bonus: ${supportBonus}%</b>`;
    supportBonusContainer.classList.add('support-bonus-container');

    const partyImage = document.createElement('img');
    partyImage.src = `./battleAssets/${battleKey}/${playerName}/party.png`;
    partyImage.alt = `${playerName}_party.png`;
    partyImage.classList.add('party-image');

    partyEmbed.appendChild(partyHeader);
    partyEmbed.appendChild(supportBonusContainer);
    partyEmbed.appendChild(partyImage);
    return partyEmbed;
}

function createPartyStats(battleObj, battleKey, playerName, hasStrength, partyArray) {
    const partyStats = document.createElement('div');

    const statSymbol = {
        "initiative": "🏃",
        "mental": "🧠",
        "physical": "💪",
        "social": "🗣️",
        "resolve": "❤️"
    }

    const activeHeader = document.createElement('div');
    activeHeader.innerHTML = "<b>Active</b>";
    if (hasStrength) {
        activeHeader.innerHTML += " (Strength 3: 🏃🧠💪🗣️❤️ +10%)";
    }

    const activeCharStats = document.createElement('div');
    activeCharStats.classList.add('party-stats-grid');
    for (let i = 0; i < 3; i++) {
        const charName = partyArray[i].name;
        if (charName == "empty") {
            continue;
        }

        const numStarsCell = document.createElement('div');
        numStarsCell.classList.add('cell');
        numStarsCell.innerHTML = `${partyArray[i].numStars}⭐`;
        activeCharStats.appendChild(numStarsCell);

        const charNameCell = document.createElement('div');
        charNameCell.classList.add('cell');
        charNameCell.innerHTML = `${charName}`;
        activeCharStats.appendChild(charNameCell);

        for (let stat of ['initiative', 'mental', 'physical', 'social', 'resolve']) {
            const newCell = document.createElement('div');
            newCell.classList.add('cell');
            newCell.innerHTML = `${statSymbol[stat]}${battleObj[battleKey][playerName].chars[charName][stat]}`;
            activeCharStats.appendChild(newCell);
        }
    }

    statSymbol.ability = "🏃🧠💪🗣️";

    const benchHeader = document.createElement('div');
    benchHeader.innerHTML = '<b>Bench</b>'

    const benchCharStats = document.createElement('div');
    benchCharStats.classList.add('party-stats-grid');
    for (let i = 3; i < 6; i++) {
        const charName = partyArray[i].name;
        if (charName == "empty") {
            continue;
        }

        const numStarsCell = document.createElement('div');
        numStarsCell.classList.add('cell');
        numStarsCell.innerHTML = `${partyArray[i].numStars}⭐`;
        benchCharStats.appendChild(numStarsCell);

        const charNameCell = document.createElement('div');
        charNameCell.classList.add('cell');
        charNameCell.innerHTML = `${charName}`;
        benchCharStats.appendChild(charNameCell);

        let supportCategory = battleObj[battleKey][playerName].chars[charName].supportCategory;
        supportCategory = supportCategory.charAt(0).toLowerCase() + supportCategory.slice(1);
        const supportCategoryCell = document.createElement('div');
        supportCategoryCell.classList.add('cell');
        supportCategoryCell.innerHTML = `${statSymbol[supportCategory]}`;
        benchCharStats.appendChild(supportCategoryCell);
        
        const supportBonus = battleObj[battleKey][playerName].chars[charName].supportBonus;
        const supportBonusCell = document.createElement('div');
        supportBonusCell.classList.add('cell');
        supportBonusCell.innerHTML = `+${supportBonus}%`;
        benchCharStats.appendChild(supportBonusCell);

        for (let j = 0; j < 3; j++) {
            const newCell = document.createElement('div');
            newCell.classList.add('cell');
            const activeCharName = partyArray[j].name;
            if (activeCharName == "empty") {
                benchCharStats.append(newCell);
                continue;
            }
            
            for (let ally of battleObj[battleKey][playerName].chars[charName].allies) {
                if (battleObj[battleKey][playerName].chars[activeCharName].tags.includes(ally)) {
                    newCell.innerHTML = activeCharName;
                }
            }
            benchCharStats.append(newCell);
        }

    }

    partyStats.append(activeHeader);
    partyStats.append(activeCharStats);
    partyStats.append(benchHeader);
    partyStats.append(benchCharStats);
    return partyStats;
}