//functions for dealing with field effects

export function addFieldEffect(battleObj, battleKey, fieldEffect, turn, numTurns) {
    if (!hasFieldEffect(battleObj, battleKey, fieldEffect)) {
        battleObj[battleKey].fieldEffects.push({
            name: fieldEffect,
            startTurn: turn,
            endTurn: turn + numTurns
        });
    }
}

export function removeExpiredFieldEffects(battleObj, battleKey, turn) {

    for (let i = 0; i < battleObj[battleKey].fieldEffects.length; i++) {
        let thisFieldEffect = battleObj[battleKey].fieldEffects[i];
    
        if (thisFieldEffect.endTurn == turn) {
            if (typeof battleObj[battleKey].log !== 'undefined') {
                //battleObj[battleKey].log(`${fieldEffect} field effect expired!`);
            }
            battleObj[battleKey].fieldEffects.splice(i, 1);
            i--;
        }
    }
}

export function hasFieldEffect(battleObj, battleKey, fieldEffect) {
    return battleObj[battleKey].fieldEffects.some(el => el.name == fieldEffect);
}