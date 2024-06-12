// add or remove buffs or debuffs.

export function addBoost(battleObj, battleKey, playerName, charName, boost, turn) {
    //TODO: remove this
    battleObj[battleKey].log(`${boost} added to ${playerName}'s ${charName}!`);

    // I arrange these alphabetically
    switch (boost) {

        case 'Arrogance':
        case 'Blazing Form':
        case 'Boss Orders':
        case 'Introversion':
        case '1-turn Lead By Example':
        case '2-turn Lead By Example':
        case 'Study Initiative':
        case 'Study Mental':
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

export function hasBoost(battleObj, battleKey, playerName, charName, boost) {
    let hasBuff = battleObj[battleKey][playerName].chars[charName].buffs.reduce((accumulator, currentBuff) => {
        return accumulator || currentBuff.name == boost;
    }, false);

    let hasDebuff = battleObj[battleKey][playerName].chars[charName].debuffs.reduce((accumulator, currentDebuff) => {
        return accumulator || currentDebuff.name == boost;
    }, false);

    return hasBuff || hasDebuff;
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
                endTurn: turn + 2,
                stat: "ability",
                amount: arroganceBuff
            });
            break;
        
        case 'Blazing Form':
            let blazingFormBuff = 0.2;
            thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * blazingFormBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 5,
                stat: "physical",
                amount: blazingFormBuff
            }); 
            break;

        case 'Boss Orders':
            let bossOrdersBuff = 0.5;
            thisChar.mental = Math.round(thisChar.mental + (thisCharInitial.mental * bossOrdersBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "mental",
                amount: bossOrdersBuff
            }); 
            break;

        case 'Introversion':
            let introversionBuff = 0.6;
            thisChar.mental = Math.round(thisChar.mental + (thisCharInitial.mental * introversionBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "mental",
                amount: introversionBuff
            });                       
            break;

        case '1-turn Lead By Example':
            let leadByExampleBuff = 0.25;
            thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * leadByExampleBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 1,
                stat: "physical",
                amount: leadByExampleBuff
            }); 
            break;
        
        case '2-turn Lead By Example':
            thisChar.physical = Math.round(thisChar.physical + (thisCharInitial.physical * leadByExampleBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 2,
                stat: "physical",
                amount: leadByExampleBuff
            }); 
            break;
        
        case 'Study Initiative':
            let studyInitiativeBuff = 1;
            thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * initiativeBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 1,
                stat: "initiative",
                amount: studyInitiativeBuff
            }); 
            break;
        
        case 'Study Mental':
            let studyMentalBuff = 1.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 1,
                stat: "mental",
                amount: studyMentalBuff
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
                endTurn: Infinity,
                stat: "ability",
                amount: thePerfectExistenceBuff
            }); 
            break;

        case 'Unity':
            let unityBuff = 0.35;
            buffCharAbility(thisChar, thisCharInitial, unityBuff);
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 5,
                stat: "ability",
                amount: unityBuff
            }); 
            break;

        case 'Zenith Pace':
            let zenithPaceBuff = 0.25;
            thisChar.initiative = Math.round(thisChar.initiative + (thisCharInitial.initiative * zenithPaceBuff));
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "initiative",
                amount: zenithPaceBuff
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
                endTurn: turn + 4,
                stat: "social",
                amount: charmDebuff
            })
            break;

        case 'Dominate':
            let dominateDebuff = -0.75;
            buffCharAbility(thisChar, thisCharInitial, dominateDebuff);
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: turn + 5,
                stat: "ability",
                amount: dominateDebuff
            }); 
            break;

        case 'Hate':
            let hateDebuff = -0.35;
            buffCharAbility(thisChar, thisCharInitial, hateDebuff);
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: turn + 4,
                stat: "ability",
                amount: hateDebuff
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
                startTurn: turn,
                endTurn: turn + 2,
                stat: highestAttackStat,
                amount: humiliateDebuff
            }); 
            break;

        case 'Kings Command':
            let kingsCommandDebuff = -0.25;
            buffCharAbility(thisChar, thisCharInitial, kingsCommandDebuff);
            createPawn(battleObj, battleKey, playerName, charName);
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "ability",
                amount: kingsCommandDebuff
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
        let thisBuff = thisChar.buffs[i];

        if (thisBuff.endTurn == turn) {
            if (thisBuff.stat == "ability") {
                buffCharAbility(thisChar, thisCharInitial, thisBuff.amount * -1);
            } else {
                thisChar[thisBuff.stat] = Math.round(thisChar[thisBuff.stat] + (thisCharInitial[thisBuff.stat] * thisBuff.amount * -1));
            }
            battleObj[battleKey].log(`${charName}'s ${thisBuff.name} buff expired! ${thisBuff.stat} decreased by ${thisBuff.amount}%`);
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
        let thisDebuff = thisChar.debuffs[i];

        if (thisDebuff.endTurn == turn) {
            if (thisDebuff.stat == "ability") {
                buffCharAbility(thisChar, thisCharInitial, thisDebuff.amount * -1);
            } else {
                thisChar[thisDebuff.stat] = Math.round(thisChar[thisDebuff.stat] + (thisCharInitial[thisDebuff.stat] * thisDebuff.amount * -1));
            }
            battleObj[battleKey].log(`${charName}'s ${thisDebuff.name} debuff expired! ${thisDebuff.stat} increased by ${thisDebuff.amount * -1}%`);
            thisChar.debuffs.splice(i, 1);
            i--;
        }
    }
}