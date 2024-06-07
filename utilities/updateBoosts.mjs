// Check if a buff or debuff has expired, and update stats accordingly.

export function addBoost(battleObj, battleKey, playerName, charName, boost, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];
    let thisCharInitial = battleObj[battleKey][playerName].initialStats[charName];

    switch (boost) {
        case 'Hate':
            let hateDebuff = -0.35;
            buffCharAbility(thisChar, thisCharInitial, hateDebuff);
            battleObj[battleKey][playerName].chars[charName].boosts.push({
                name: boost,
                endTurn: turn + 4
            }); 
            break;
        case 'Unity':
            let unityBuff = 0.35;
            buffCharAbility(thisChar, thisCharInitial, unityBuff);
            battleObj[battleKey][playerName].chars[charName].boosts.push({
                name: boost,
                endTurn: turn + 5
            }); 
            break;
        case 'Study':
            let initiativeBuff = 1;
            let mentalBuff = 1.5;
            thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * initiativeBuff));
            thisChar.mental     = Math.round(thisChar.mental     + (thisCharInitial.mental     * mentalBuff    ));
            battleObj[battleKey][playerName].chars[charName].boosts.push({
                name: boost,
                endTurn: turn + 1
            }); 
            break;
        case 'Dominate':
            let dominateDebuff = -0.75;
            buffCharAbility(thisChar, thisCharInitial, dominateDebuff);
            battleObj[battleKey][playerName].chars[charName].boosts.push({
                name: boost,
                endTurn: turn + 5
            }); 
            break;
        case 'Humiliate':
            //TODO
            let humiliateDebuff = -0.25;
            let highestAttackStat = "";
            battleObj[battleKey][playerName].chars[charName].boosts.push({
                name: boost,
                endTurn: turn + 2
            }); 
            break;
        case 'Blazing Form':
            let blazingFormBuff = 0.2;
            thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * blazingFormBuff));
            battleObj[battleKey][playerName].chars[charName].boosts.push({
                name: boost,
                endTurn: turn + 5
            }); 
            break;
        case 'Lead By Example':
            break;
        case 'Kings Command':
            let kingsCommandDebuff = -0.25;
            buffCharAbility(thisChar, thisCharInitial, kingsCommandDebuff);
            break;
        case 'Boss Orders':
            let bossOrdersBuff = 0.5;
            thisChar.mental = Math.round(thisChar.mental + (thisCharInitial.mental * bossOrdersBuff));
            break;
    }
}

export function checkBoostsExpired(battleObj, battleKey, playerName, turn) {
    for (let charKey in battleObj[battleKey][playerName].chars) {
        let thisChar = battleObj[battleKey][playerName].chars[charKey];
        let thisCharInitial = battleObj[battleKey][playerName].initialStats[charKey];
        if (thisChar.resolve == 0) {
            continue;
        }
        for (let i = 0; i < thisChar.boosts.length; i++) {
            if (thisChar.boosts[i].endTurn == turn) {
                switch (thisChar.boosts[i].name) {
                    case 'Hate':
                        let hateDebuff = -0.35;
                        buffCharAbility(thisChar, thisCharInitial, hateDebuff * -1);
                        console.log(`${charKey}'s Hate debuff expired! Ability increased by ${hateDebuff}%.`);
                        break;
                    case 'Unity':
                        let unityBuff = 0.35;
                        buffCharAbility(thisChar, thisCharInitial, unityBuff * -1);
                        console.log(`${charKey}'s Unity buff expired! Ability weakened by ${unityBuff}%.`);
                        break;
                    case 'Study':
                        let initiativeBuff = 1;
                        let mentalBuff = 1.5;
                        thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * initiativeBuff * -1));
                        thisChar.mental     = Math.round(thisChar.mental     + (thisCharInitial.mental     * mentalBuff     * -1));
                        console.log(`${charKey}'s Study buff expired! Initiative weakened by ${initiativeBuff}% and Mental weakened by ${mentalBuff}%`);
                        break;
                    case 'Dominate':
                        let dominateDebuff = -0.75;
                        buffCharAbility(thisChar, thisCharInitial, dominateDebuff * -1);
                        console.log(`${charKey}'s Dominate debuff expired! Ability increased by ${dominateDebuff}%.`);
                        break;
                    case 'Humiliate':
                        //TODO
                        let humiliateDebuff = 0.25;
                        let highestAttackStat = "";
                        console.log(`${charKey}'s Humiliate debuff expired! ${highestAttackStat} increased by ${humiliateDebuff}%.`);
                        break;
                    case 'Blazing Form':
                        let blazingFormBuff = 0.2;
                        thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * blazingFormBuff * -1));
                        console.log(`${charKey}'s Blazing Form buff expired! Physical weakened by ${blazingFormBuff}%.`);
                        break;
                    case 'Lead By Example':
                        break;
                }
                thisChar.boosts.splice(i, 1);
                i--;
            }
        }
    }
}

function buffCharAbility(char, charInitial, buffAmount) {
    char.initiative = Math.round(char.initiative + (charInitial.initiative * buffAmount));
    char.mental     = Math.round(char.mental     + (charInitial.mental     * buffAmount));
    char.physical   = Math.round(char.physical   + (charInitial.physical   * buffAmount));
    char.social     = Math.round(char.social     + (charInitial.social     * buffAmount));
}