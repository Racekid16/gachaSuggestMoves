// add or remove damage-inflict  or damage-receive modifiers.

export function addInflictModifier(battleObj, battleKey, playerName, charName, amount, turn, numTurns, canBeNullified=true) {
    battleObj[battleKey][playerName].chars[charName].inflictModifiers.push({
        startTurn: turn,
        endTurn: turn + numTurns,
        amount: amount,
        canBeNullified: canBeNullified
    });
    if (typeof battleObj[battleKey].log !== 'undefined') {
        //battleObj[battleKey].log(`+${amount * 100}% damage inflicted added to ${playerName}'s ${charName} for ${numTurns} turns!`);
    }
}

export function addReceiveModifier(battleObj, battleKey, playerName, charName, amount, turn, numTurns, canBeNullified=true) {
    battleObj[battleKey][playerName].chars[charName].receiveModifiers.push({
        startTurn: turn,
        endTurn: turn + numTurns,
        amount: amount,
        canBeNullified: canBeNullified
    });
    if (typeof battleObj[battleKey].log !== 'undefined') {
        //battleObj[battleKey].log(`${amount * 100}% damage received added to ${playerName}'s ${charName} for ${numTurns} turns!`);
    }
}

export function removeExpiredDamageModifiers(battleObj, battleKey, playerName, turn) {
    for (let charKey in battleObj[battleKey][playerName].chars) {
        removeExpiredInflictModifiers(battleObj, battleKey, playerName, charKey, turn);
        removeExpiredReceiveModifiers(battleObj, battleKey, playerName, charKey, turn);
    }
}

export function applyDamageModifiers(battleObj, battleKey, playerName) {
    for (let charName in battleObj[battleKey][playerName].chars) {
        let thisCharObj = battleObj[battleKey][playerName].chars[charName];

        if (thisCharObj.resolve == 0) {
            continue;
        }

        let inflictMultiplier = 1;
        let receiveMultiplier = 1;

        for (let inflictModifier of thisCharObj.inflictModifiers) {
            inflictMultiplier += inflictModifier.amount;
        }

        for (let receiveModifier of thisCharObj.receiveModifiers) {
            receiveMultiplier += receiveModifier.amount;
        }

        thisCharObj.inflictMultiplier = Math.max(inflictMultiplier, 0);
        thisCharObj.receiveMultiplier = Math.max(receiveMultiplier, 0);
    }
}

function removeExpiredInflictModifiers(battleObj, battleKey, playerName, charName, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];

    for (let i = 0; i < thisChar.inflictModifiers.length; i++) {
        let thisModifier = thisChar.inflictModifiers[i];
        if (thisModifier.endTurn == turn) {
            if (typeof battleObj[battleKey].log !== 'undefined' && thisChar.resolve != 0) {
                /* battleObj[battleKey].log(`${playerName}'s ${charName}'s ${thisModifier.endTurn - thisModifier.startTurn}-turn ${thisModifier.amount * 100}% `
                                       + `damage inflicted modifier expired! Damage inflicted decreased by ${thisModifier.amount * 100}%`); */
            }
            thisChar.inflictModifiers.splice(i, 1);
            i--;
        }
    }
}

function removeExpiredReceiveModifiers(battleObj, battleKey, playerName, charName, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];

    for (let i = 0; i < thisChar.receiveModifiers.length; i++) {
        let thisModifier = thisChar.receiveModifiers[i];
        if (thisModifier.endTurn == turn) {
            if (typeof battleObj[battleKey].log !== 'undefined' && thisChar.resolve != 0) {
                /* battleObj[battleKey].log(`${playerName}'s ${charName}'s ${thisModifier.endTurn - thisModifier.startTurn}-turn ${thisModifier.amount * 100}% `
                                       + `damage received modifier expired! Damage receieved increased by ${thisModifier.amount * -100}%`); */
            }
            thisChar.receiveModifiers.splice(i, 1);
            i--;
        }
    }
}