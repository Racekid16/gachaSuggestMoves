// add or remove positive or negative statuses.

export function addStatus(battleObj, battleKey, playerName, charName, status, turn, numTurns) {
    //TODO: remove this
    battleObj[battleKey].log(`${status} added to ${playerName}'s ${charName}!`);

    // I arrange these alphabetically
    switch(status) {

        case 'Invulnerable':
        case 'Resting':
            addPositiveStatus(battleObj, battleKey, playerName, charName, status, turn, numTurns);
            break;
        
        case 'Burning':
        case 'Pacified':
        case 'Stunned':
        case 'Taunted':
        case 'Trapped':
        case 'Wounded':
            addNegativeStatus(battleObj, battleKey, playerName, charName, status, turn, numTurns);
            break;

        default:
            console.log(`${status} isn't recognized as a status.`);
            break;  
    }
}

export function removeExpiredStatuses(battleObj, battleKey, playerName, turn) {
    for (let charKey in battleObj[battleKey][playerName].chars) {
        removeExpiredPositiveStatuses(battleObj, battleKey, playerName, charKey, turn);
        removeExpiredNegativeStatuses(battleObj, battleKey, playerName, charKey, turn);
    }
}

export function hasStatus(battleObj, battleKey, playerName, charName, status) {
    let hasPositiveStatus = battleObj[battleKey][playerName].chars[charName].positiveStatuses.reduce((accumulator, currentPositiveStatus) => {
        return accumulator || currentPositiveStatus.name == status;
    }, false);

    let hasNegativeStatus = battleObj[battleKey][playerName].chars[charName].negativeStatuses.reduce((accumulator, currentNegativeStatus) => {
        return accumulator || currentNegativeStatus.name == status;
    }, false);

    return hasPositiveStatus || hasNegativeStatus;
}


function addPositiveStatus(battleObj, battleKey, playerName, charName, positiveStatus, turn, numTurns) {
    battleObj[battleKey][playerName].chars[charName].positiveStatuses.push({
        name: positiveStatus,
        startTurn: turn,
        endTurn: turn + numTurns
    }); 
}

function addNegativeStatus(battleObj, battleKey, playerName, charName, negativeStatus, turn, numTurns) {
    battleObj[battleKey][playerName].chars[charName].negativeStatuses.push({
        name: negativeStatus,
        startTurn: turn,
        endTurn: turn + numTurns
    }); 
}

function removeExpiredPositiveStatuses(battleObj, battleKey, playerName, charName, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];

    if (thisChar.resolve == 0) {
        return;
    }

    for (let i = 0; i < thisChar.positiveStatuses.length; i++) {
        if (thisChar.positiveStatuses[i].endTurn == turn) {
            battleObj[battleKey].log(`${charName}'s ${thisChar.positiveStatuses[i].name} positive status expired!`);
            thisChar.positiveStatuses.splice(i, 1);
            i--;
        }
    }
}

function removeExpiredNegativeStatuses(battleObj, battleKey, playerName, charName, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];

    if (thisChar.resolve == 0) {
        return;
    }

    for (let i = 0; i < thisChar.negativeStatuses.length; i++) {
        if (thisChar.negativeStatuses[i].endTurn == turn) {
            battleObj[battleKey].log(`${charName}'s ${thisChar.negativeStatuses[i].name} negative status expired!`);
            thisChar.negativeStatuses.splice(i, 1);
            i--;
        }
    }
}