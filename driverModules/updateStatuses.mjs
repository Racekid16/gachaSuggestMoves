// add or remove positive or negative statuses.

export function addStatus(battleObj, battleKey, playerName, charName, status, turn, numTurns) {
    if  (typeof battleObj[battleKey].log !== 'undefind') {
        //battleObj[battleKey].log(`${status} added to ${playerName}'s ${charName} for ${numTurns} turns!`);
    }

    // I arrange these alphabetically
    switch (status) {

        case 'apathetic':
        case 'charged':
        case 'invulnerable':
        case 'resting':
            addPositiveStatus(battleObj, battleKey, playerName, charName, status, turn, numTurns);
            break;
        
        case 'bleeding':
        case 'burning':
        case 'pacified':
        case 'silenced':
        case 'stunned':
        case 'taunted':
        case 'trapped':
        case 'wounded':
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

export function applyStatuses(battleObj, battleKey, playerName) {
    for (let charName in battleObj[battleKey][playerName].chars) {
        let thisCharObj = battleObj[battleKey][playerName].chars[charName];

        if (thisCharObj.resolve == 0) {
            continue;
        }
        
        for (let positiveStatus of thisCharObj.positiveStatuses) {
            switch (positiveStatus.name) {
                case 'apathetic':
                    positiveStatus.originalPersonality = thisCharObj.personality;
                    thisCharObj.personality = "Apathetic";
                    break;
                default:
                    break;
            }
        }
        for (let negativeStatus of thisCharObj.negativeStatuses) {
            switch (negativeStatus.name) {
                default:
                    break;
            }
        }
    }
}

function addPositiveStatus(battleObj, battleKey, playerName, charName, positiveStatus, turn, numTurns) {
    battleObj[battleKey][playerName].chars[charName].positiveStatuses.push({
        name: positiveStatus,
        startTurn: turn,
        endTurn: turn + numTurns
    }); 
}

function addNegativeStatus(battleObj, battleKey, playerName, charName, negativeStatus, turn, numTurns) {
    if (battleObj[battleKey][playerName].chars[charName].moves.includes("Aspect Of Metal")) {
        if (typeof battleObj[battleKey].log !== 'undefined') {
            battleObj[battleKey].log(`${negativeStatus} negative status negated as ${charName} has Aspect Of Metal`);
        }
        return;
    }
    battleObj[battleKey][playerName].chars[charName].negativeStatuses.push({
        name: negativeStatus,
        startTurn: turn,
        endTurn: turn + numTurns
    }); 
}

function removeExpiredPositiveStatuses(battleObj, battleKey, playerName, charName, turn) {
    let thisCharObj = battleObj[battleKey][playerName].chars[charName];

    for (let i = 0; i < thisCharObj.positiveStatuses.length; i++) {
        let thisPositiveStatus = thisCharObj.positiveStatuses[i];
    
        if (thisPositiveStatus.endTurn == turn) {
            if (typeof battleObj[battleKey].log !== 'undefined' && thisCharObj.resolve != 0) {
                //battleObj[battleKey].log(`${charName}'s ${thisPositiveStatus.name} positive status expired!`);
            }
            switch (thisPositiveStatus.name) {
                case 'apathetic':
                    thisCharObj.personality = thisPositiveStatus.original;
                    break;
                default:
                    break;
            }
            thisCharObj.positiveStatuses.splice(i, 1);
            i--;
        }
    }
}

function removeExpiredNegativeStatuses(battleObj, battleKey, playerName, charName, turn) {
    let thisCharObj = battleObj[battleKey][playerName].chars[charName];

    for (let i = 0; i < thisCharObj.negativeStatuses.length; i++) {
        let thisNegativeStatus = thisCharObj.negativeStatuses[i];
    
        if (thisNegativeStatus.endTurn == turn) {
            if (typeof battleObj[battleKey].log !== 'undefined' && thisCharObj.resolve != 0) {
                //battleObj[battleKey].log(`${charName}'s ${thisNegativeStatus.name} negative status expired!`);
            }
            switch (thisNegativeStatus.name) {
                default:
                    break;
            }
            thisCharObj.negativeStatuses.splice(i, 1);
            i--;
        }
    }
}