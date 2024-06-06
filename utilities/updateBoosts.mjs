// Check if a buff or debuff has expired, and update stats accordingly.

// possible TODO: update this function so it also updates when a new buff/debuff is applied.
export function updateBoosts(battleObj, playerName, battleKey, turn) {
    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        let thisCharInitial = battleObj[battleKey][playerName].initialStats[charKey];
        if (thisChar.resolve == 0) {
            continue;
        }
        for (let i = 0; i < thisChar.boosts.length; i++) {
            if (thisChar.boosts[i].endTurn == turn) {
                switch (thisChar.boosts[i].name) {
                    case 'Unity':
                        let unityBuff = 0.35;
                        thisChar.initiative = Math.round(thisChar.initiative - (thisCharInitial.initiative * unityBuff));
                        thisChar.mental     = Math.round(thisChar.mental     - (thisCharInitial.mental     * unityBuff));
                        thisChar.physical   = Math.round(thisChar.physical   - (thisCharInitial.physical   * unityBuff));
                        thisChar.social     = Math.round(thisChar.social     - (thisCharInitial.social     * unityBuff));
                        console.log(`${charKey}'s Unity buff expired! Ability weakened by ${unityBuff}%.`);
                        break;
                    case 'Hate':
                        let hateDebuff = 0.35;
                        thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * hateDebuff));
                        thisChar.mental     = Math.round(thisChar.mental     + (thisCharInitial.mental     * hateDebuff));
                        thisChar.physical   = Math.round(thisChar.physical   + (thisCharInitial.physical   * hateDebuff));
                        thisChar.social     = Math.round(thisChar.social     + (thisCharInitial.social     * hateDebuff));
                        console.log(`${charKey}'s Hate debuff expired! Ability increased by ${hateDebuff}%.`);
                        break;
                    case 'Study':
                        let initiativeBuff = 1;
                        let mentalBuff = 1.5;
                        thisChar.initiative = Math.round(thisChar.initiative / (1 + initiativeBuff));
                        thisChar.mental     = Math.round(thisChar.mental     / (1 + mentalBuff)    );
                        console.log(`${charKey}'s Study buff expired! Initiative weakened by ${initiativeBuff}% and Mental weakened by ${mentalBuff}%`);
                        break;
                    case 'Arrogance':
                        let arroganceBuff = 0.4;
                        thisChar.initiative = Math.round(thisChar.initiative / (1 + arroganceBuff));
                        thisChar.mental     = Math.round(thisChar.mental     / (1 + arroganceBuff));
                        thisChar.physical   = Math.round(thisChar.physical   / (1 + arroganceBuff));
                        thisChar.social     = Math.round(thisChar.social     / (1 + arroganceBuff));
                        console.log(`${charKey}'s Arrogance buff expired! Ability weakened by ${arroganceBuff}%.`);
                        break;
                    case 'Dominate':
                        let dominateDebuff = 0.75;
                        thisChar.initiative = Math.round(thisChar.initiative / (1 - dominateDebuff));
                        thisChar.mental     = Math.round(thisChar.mental     / (1 - dominateDebuff));
                        thisChar.physical   = Math.round(thisChar.physical   / (1 - dominateDebuff));
                        thisChar.social     = Math.round(thisChar.social     / (1 - dominateDebuff));
                        console.log(`${charKey}'s Dominate debuff expired! Ability increased by ${dominateDebuff}%.`);
                        break;
                }
                thisChar.boosts.splice(i, 1);
                i--;
            }
        }
    }
}
