//functions for creating tables

export function createPartyFlexBox(battleObj, battleKey, playerName, partyJSON, imageURL) {
    const partyContainer = document.createElement('div');
    partyContainer.style.height = "30%";
    partyContainer.classList.add('party-information');

    const partyImage = document.createElement('img');
    partyImage.src = imageURL;
    partyImage.alt = `${playerName} party image`;
    partyImage.classList.add('party-image');

    const partyStats = document.createElement('div');
    partyStats.classList.add('party-stats');

    partyContainer.appendChild(partyImage);
    partyContainer.appendChild(partyStats);
    return partyContainer
}

export function createSuggestedMoveFlexBox() {
    
}