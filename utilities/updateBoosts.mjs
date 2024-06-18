// add or remove buffs or debuffs.
import { round } from './round.mjs';

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
        case 'Humiliate Mental':
        case 'Humiliate Physical':
        case 'Humiliate Social':
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

export function applyBoosts(battleObj, battleKey, playerName) {
    for (let charName in battleObj[battleKey][playerName].chars) {
        let thisCharObj = battleObj[battleKey][playerName].chars[charName];
        let thisCharInitialObj = battleObj[battleKey][playerName].initialCharStats[charName];
        let multiplierObj = {
            'initiative': 1,
            'mental': 1,
            'physical': 1,
            'social': 1
        };

        for (let i = 0; i < thisCharObj.buffs.length; i++) {
            let buff = thisCharObj.buffs[i];
            if (buff.stat == 'ability') {
                multiplierObj.initiative += buff.amount;
                multiplierObj.mental += buff.amount;
                multiplierObj.physical += buff.amount;
                multiplierObj.social += buff.amount;
            } else {
                multiplierObj[buff.stat] += buff.amount;
            }
        }

        for (let i = 0; i < thisCharObj.debuffs.length; i++) {
            let debuff = thisCharObj.debuffs[i];
            if (thisCharObj.moves.includes('Lead By Example') && (debuff.stat == 'ability' || debuff.stat == 'physical')) {
                battleObj[battleKey].log(`${debuff} debuff negated as it would lower ${charName}'s physical`);
                thisChar.debuffs.splice(i, 1);
                i--;
                continue;
            }
            if (debuff.stat == 'ability') {
                multiplierObj.initiative += debuff.amount;
                multiplierObj.mental += debuff.amount;
                multiplierObj.physical += debuff.amount;
                multiplierObj.social += debuff.amount;
            } else {
                multiplierObj[debuff.stat] += debuff.amount;
            }
        }

        for (let stat in multiplierObj) {
            thisCharObj[stat] = round(thisCharInitialObj[stat] * multiplierObj[stat]);
            thisCharObj[stat] = Math.max(thisCharObj[stat], 0);
        }
    }
}

function addBuff(battleObj, battleKey, playerName, charName, buff, turn) {

    switch (buff) {

        case 'Arrogance':
            let arroganceBuff = 0.4;
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
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "mental",
                amount: introversionBuff
            });                       
            break;

        case '1-turn Lead By Example':
            let leadByExampleBuff1 = 0.25;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 1,
                stat: "physical",
                amount: leadByExampleBuff1
            }); 
            break;
        
        case '2-turn Lead By Example':
            let leadByExampleBuff2 = 0.25;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 2,
                stat: "physical",
                amount: leadByExampleBuff2
            }); 
            break;
        
        case 'Study Initiative':
            let studyInitiativeBuff = 1;
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
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "ability",
                amount: thePerfectExistenceBuff
            }); 
            break;

        case 'Unity':
            let hasUnityBuff = hasBoost(battleObj, battleKey, playerName, charName, "Unity");
            if (!hasUnityBuff) {
                let unityBuff = 0.35;
                battleObj[battleKey][playerName].chars[charName].buffs.push({
                    name: buff,
                    startTurn: turn,
                    endTurn: turn + 5,
                    stat: "ability",
                    amount: unityBuff
                });
            }
            break;

        case 'Zenith Pace':
            let zenithPaceBuff = 0.25;
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

    switch (debuff) {

        case 'Charm':
            let charmDebuff = -0.33;
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
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: turn + 5,
                stat: "ability",
                amount: dominateDebuff
            }); 
            break;

        case 'Hate':
            let hasHateDebuff = hasBoost(battleObj, battleKey, playerName, charName, "Hate");
            if (!hasHateDebuff) {
                let hateDebuff = -0.35;
                battleObj[battleKey][playerName].chars[charName].debuffs.push({
                    name: debuff,
                    startTurn: turn,
                    endTurn: turn + 4,
                    stat: "ability",
                    amount: hateDebuff
                }); 
            }
            break;

        case 'Humiliate Mental':
        case 'Humiliate Physical':
        case 'Humiliate Social':
            let humiliateDebuff = -0.25;
            let highestAttackStat = debuff.split(" ")[1].toLowerCase();
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

function removeExpiredBuffs(battleObj, battleKey, playerName, charName, turn) {
    let thisChar = battleObj[battleKey][playerName].chars[charName];
    let thisCharInitial = battleObj[battleKey][playerName].initialCharStats[charName];
    if (thisChar.resolve == 0) {
        return;
    }

    for (let i = 0; i < thisChar.buffs.length; i++) {
        let thisBuff = thisChar.buffs[i];

        if (thisBuff.endTurn == turn) {
            battleObj[battleKey].log(`${charName}'s ${thisBuff.name} buff expired! ${thisBuff.stat} decreased by ${thisBuff.amount * 100}%`);
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
            battleObj[battleKey].log(`${charName}'s ${thisDebuff.name} debuff expired! ${thisDebuff.stat} increased by ${thisDebuff.amount * -100}%`);
            thisChar.debuffs.splice(i, 1);
            i--;
        }
    }
}