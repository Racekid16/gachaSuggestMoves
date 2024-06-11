// Check if a buff or debuff has expired, and update stats accordingly.

export function addBoost(battleObj, battleKey, playerName, charName, boost, turn) {
    //TODO: remove this
    battleObj[battleKey].log(`${boost} added to ${playerName}'s ${charName}!`);

    // I arrange these alphabetically
    switch(boost) {

        case 'Arrogance':
        case 'Blazing Form':
        case 'Boss Orders':
        case 'Introversion':
        case 'Lead By Example':
        case 'Study':
        case 'The Perfect Existence':
        case 'Unity':
        case 'Zenith Pace':
            addBuff(battleObj, battleKey, playerName, charName, boost, turn);
            break;
        
        case 'Charm':
        case 'Dominate':
        case 'Hate':
        case 'Humiliate':
        case 'Kings Command':
            addDebuff(battleObj, battleKey, playerName, charName, boost, turn);
            break;

        default:
            console.log(`${boost} isn't recognized as a boost.`);
            break;        
    }
}

// adds the specified boost to all members on the attacker's team (including the attacker themself)
// who have more than 0 resolve
export function addBoostToAliveTeammates(battleObj, battleKey, attacker, boost, turn) {
    for (let charKey in battleObj[battleKey][attacker].chars) {
        let charResolve = battleObj[battleKey][attacker].chars[charKey].resolve;
        if (charResolve > 0) {
            addBoost(battleObj, battleKey, attacker, charKey, boost, turn);        
        }
    }
}

export function removeExpiredBoosts(battleObj, battleKey, playerName, turn) {
    for (let charKey in battleObj[battleKey][playerName].chars) {
        removeExpiredBuffs(battleObj, battleKey, playerName, charKey, turn);
        removeExpiredDebuffs(battleObj, battleKey, playerName, charKey, turn);
    }
}

function addBuff(battleObj, battleKey, playerName, charName, buff, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];
    let thisCharInitial = battleObj[battleKey][playerName].initialCharStats[charName];

    switch (buff) {

        case 'Arrogance':
            let arroganceBuff = 0.4;
            buffCharAbility(thisChar, thisCharInitial, arroganceBuff);
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 2
            });
            break;
        
        case 'Blazing Form':
            let blazingFormBuff = 0.2;
            thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * blazingFormBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 5
            }); 
            break;

        case 'Boss Orders':
            let bossOrdersBuff = 0.5;
            thisChar.mental = Math.round(thisChar.mental + (thisCharInitial.mental * bossOrdersBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity
            }); 
            break;

        case 'Introversion':
            let introversionBuff = 0.6;
            thisChar.mental = Math.round(thisChar.mental + (thisCharInitial.mental * introversionBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity
            });                       
            break;

        case 'Lead By Example':
            let leadByExampleBuff = 0.25;
            thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * leadByExampleBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 1
            }); 
            thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * leadByExampleBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 2
            }); 
            break;
        
        case 'Study':
            let initiativeBuff = 1;
            let mentalBuff = 1.5;
            thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * initiativeBuff));
            thisChar.mental     = Math.round(thisChar.mental     + (thisCharInitial.mental     * mentalBuff    ));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 1
            }); 
            break;
        
        case 'The Perfect Existence':
            let thePerfectExistenceBuff = 0.5;
            buffCharAbility(thisChar, thisCharInitial, thePerfectExistenceBuff);
            thisChar.moves.splice(thisChar.moves.indexOf("The Perfect Existence"), 1);
            thisChar.moves.splice(thisCharInitial.moves.indexOf("The Perfect Existence"), 1);
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity
            }); 
            break;

        case 'Unity':
            let unityBuff = 0.35;
            buffCharAbility(thisChar, thisCharInitial, unityBuff);
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 5
            }); 
            break;

        case 'Zenith Pace':
            let zenithPaceBuff = 0.25;
            thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * zenithPaceBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity
            })

        default:
            break;
    }
}

function addDebuff(battleObj, battleKey, playerName, charName, debuff, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];
    let thisCharInitial = battleObj[battleKey][playerName].initialCharStats[charName];

    //this isn't an elegant way to code in Lead By Example, but I'm too lazy to improve this
    if (battleObj[battleKey][playerName].chars[charName].moves.includes('Lead By Example')
     && ['Dominate', 'Hate', 'Kings Command'].includes(debuff)) {
        battleObj[battleKey].log(`${debuff} debuff negated as it would lower ${charName}'s physical`);
        return;
    }

    switch (debuff) {

        case 'Charm':
            let charmDebuff = -0.33;
            thisChar.social = Math.round(thisChar.social + (thisCharInitial.social * charmDebuff));
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: turn + 4
            })
            break;

        case 'Dominate':
            let dominateDebuff = -0.75;
            buffCharAbility(thisChar, thisCharInitial, dominateDebuff);
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: turn + 5
            }); 
            break;

        case 'Hate':
            let hateDebuff = -0.35;
            buffCharAbility(thisChar, thisCharInitial, hateDebuff);
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: turn + 4
            }); 
            break;

        case 'Humiliate':
            let humiliateDebuff = -0.25;
            let attackStats = ['mental', 'physical', 'social'];
            let highestAttackStat = '';
            let highestAttackStatVal = -1;
            for (let attackStat of attackStats) {
                if (thisChar[attackStat] > highestAttackStatVal) {
                    highestAttackStat = attackStat;
                    highestAttackStatVal = thisChar[attackStat];
                }
            }

            if (battleObj[battleKey][playerName].chars[charName].moves.includes('Lead By Example')
             && highestAttackStat == 'physical') {
                battleObj[battleKey].log(`${debuff} debuff negated as it would lower ${charName}'s physical`);
                return;
            }

            thisChar[highestAttackStat] = Math.round(thisChar[highestAttackStat] + (thisCharInitial[highestAttackStat] * humiliateDebuff));
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                highestAttackStat: highestAttackStat,
                startTurn: turn,
                endTurn: turn + 2
            }); 
            break;

        case 'Kings Command':
            let kingsCommandDebuff = -0.25;
            buffCharAbility(thisChar, thisCharInitial, kingsCommandDebuff);
            createPawn(battleObj, battleKey, playerName, charName);
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: Infinity
            }); 
            break;

        default:
            break;
    }
}

function buffCharAbility(char, charInitial, buffAmount) {
    char.initiative = Math.round(char.initiative + (charInitial.initiative * buffAmount));
    char.mental     = Math.round(char.mental     + (charInitial.mental     * buffAmount));
    char.physical   = Math.round(char.physical   + (charInitial.physical   * buffAmount));
    char.social     = Math.round(char.social     + (charInitial.social     * buffAmount));
}

function createPawn(battleObj, battleKey, playerName, creatorCharName) {
    let creatorInitialStats = battleObj[battleKey][playerName].initialCharStats[creatorCharName];
    let inheritAmount = 0.75;

    battleObj[battleKey][playerName].chars.Pawn = {
        personality: "Timid",
        moves: ["Scheming", "Athleticism", "Influence"],
        tags: ["Persona"],
        buffs: [],
        debuffs: [],
        positiveStatuses: [],
        negativeStatuses: [],
        priority: 0,
        initiative: Math.round(creatorInitialStats.initiative * inheritAmount),
        mental: Math.round(creatorInitialStats.mental * inheritAmount),
        physical: Math.round(creatorInitialStats.physical * inheritAmount),
        social: Math.round(creatorInitialStats.social * inheritAmount),
        resolve: Math.round(creatorInitialStats.resolve * inheritAmount)
    };
    battleObj[battleKey][playerName].initialCharStats.Pawn = structuredClone(battleObj[battleKey][playerName].chars.Pawn);
}

function removeExpiredBuffs(battleObj, battleKey, playerName, charName, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];
    let thisCharInitial = battleObj[battleKey][playerName].initialCharStats[charName];
    if (thisChar.resolve == 0) {
        return;
    }

    for (let i = 0; i < thisChar.buffs.length; i++) {
        if (thisChar.buffs[i].endTurn == turn) {
            switch (thisChar.buffs[i].name) {

                case 'Arrogance':
                    let arroganceBuff = 0.4;
                    buffCharAbility(thisChar, thisCharInitial, arroganceBuff * -1);
                    battleObj[battleKey].log(`${charName}'s Arrogance buff expired! Ability weakened by ${arroganceBuff * 100}%.`);
                    break;

                case 'Blazing Form':
                    let blazingFormBuff = 0.2;
                    thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * blazingFormBuff * -1));
                    battleObj[battleKey].log(`${charName}'s Blazing Form buff expired! Physical weakened by ${blazingFormBuff * 100}%.`);
                    break;

                case 'Lead By Example':
                    let leadByExampleBuff = 0.25;
                    thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * leadByExampleBuff * -1));
                    battleObj[battleKey].log(`${charName}'s Lead By Example buff expired! Physical weakened by ${leadByExampleBuff * 100}%.`);
                    break;
                
                case 'Study':
                    let initiativeBuff = 1;
                    let mentalBuff = 1.5;
                    thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * initiativeBuff * -1));
                    thisChar.mental     = Math.round(thisChar.mental     + (thisCharInitial.mental     * mentalBuff     * -1));
                    battleObj[battleKey].log(`${charName}'s Study buff expired! Initiative weakened by ${initiativeBuff * 100}% `
                                + `and Mental weakened by ${mentalBuff * 100}%`);
                    break;
                
                case 'Unity':
                    let unityBuff = 0.35;
                    buffCharAbility(thisChar, thisCharInitial, unityBuff * -1);
                    battleObj[battleKey].log(`${charName}'s Unity buff expired! Ability weakened by ${unityBuff * 100}%.`);
                    break;

                default:
                    break;
            }
            thisChar.buffs.splice(i, 1);
            i--;
        }
    }
}

function removeExpiredDebuffs(battleObj, battleKey, playerName, charName, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];
    let thisCharInitial = battleObj[battleKey][playerName].initialCharStats[charName];
    if (thisChar.resolve == 0) {
        return;
    }

    for (let i = 0; i < thisChar.debuffs.length; i++) {
        if (thisChar.debuffs[i].endTurn == turn) {
            switch (thisChar.debuffs[i].name) {

                case 'Charm':
                    let charmDebuff = -0.33;
                    thisChar.social = Math.round(thisChar.social + (thisCharInitial.social * charmDebuff * -1));
                    battleObj[battleKey].log(`${charName}'s Charm debuff expired! Social increased by ${charmDebuff * -100}%`);
                    break;

                case 'Dominate':
                    let dominateDebuff = -0.75;
                    buffCharAbility(thisChar, thisCharInitial, dominateDebuff * -1);
                    battleObj[battleKey].log(`${charName}'s Dominate debuff expired! Ability increased by ${dominateDebuff * -100}%.`);
                    break;
                
                case 'Hate':
                    let hateDebuff = -0.35;
                    buffCharAbility(thisChar, thisCharInitial, hateDebuff * -1);
                    battleObj[battleKey].log(`${charName}'s Hate debuff expired! Ability increased by ${hateDebuff * -100}%.`);
                    break;

                case 'Humiliate':
                    let humiliateDebuff = -0.25;
                    let highestAttackStat = thisChar.debuffs[i].highestAttackStat;
                    thisChar[highestAttackStat] = Math.round(thisChar[highestAttackStat] + (thisCharInitial[highestAttackStat] * humiliateDebuff * -1));
                    battleObj[battleKey].log(`${charName}'s Humiliate debuff expired! ${highestAttackStat} increased by ${humiliateDebuff * -100}%.`);
                    break;
                
                default:
                    break;
            }
            thisChar.debuffs.splice(i, 1);
            i--;
        }
    }
}