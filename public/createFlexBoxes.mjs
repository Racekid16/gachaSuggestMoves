//functions for creating tables

export function createPartyFlexBox(battleObj, battleKey, playerName, partyJSON, imageURL) {
    const tableContainer = document.createElement('div');
    tableContainer.style.height = "30%";
    const table = document.createElement('table');
    const tableBody = document.createElement('tbody');
    const tableRow = document.createElement('tr');
    const col1 = document.createElement('td');

    const partyImage = document.createElement('img');
    partyImage.src = imageURL;
    partyImage.alt = `${playerName} party image`;
    partyImage.style.maxHeight = `${window.innerHeight* 0.4}px`;

    const col2 = document.createElement('td');
    col2.textContent = playerName;

    col1.appendChild(partyImage);
    tableRow.appendChild(col1);
    tableRow.appendChild(col2);
    tableBody.appendChild(tableRow);
    table.appendChild(tableBody);
    tableContainer.appendChild(table);
    return tableContainer;
}

export function createSuggestedMoveFlexBox() {
    
}