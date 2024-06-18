// add or remove buffs or debuffs.
import { round } from './round.mjs';

export function addBoost(battleObj, battleKey, playerName, charName, boost, turn) {
    // I arrange these alphabetically
    switch (boost) {

        case 'Aspect Of Fire Mental':
        case 'Aspect Of Fire Physical':
        case 'Aspect Of Fire Social':
        case 'Aspect Of Metal Mental':
        case 'Aspect Of Metal Physical':
        case 'Aspect Of Metal Social':
        case 'Arrogance':
        case 'Blazing Form':
        case 'Boss Orders':
        case 'Bottle Break Initiative':
        case 'Bottle Break Social':
        case 'Group Ties':
        case 'Introversion':
        case '1-turn Lead By Example':
        case '2-turn Lead By Example':
        case 'Study Initiative':
        case 'Study Mental':
        case 'Teamwork':
        case 'The Perfect Existence':
        case 'Unity':
        case 'Zenith Pace':
            addBuff(battleObj, battleKey, playerName, charName, boost, turn);
            break;
        
        case 'Bottle Break Physical':
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
export function addBoostToAliveTeammates(battleObj, battleKey, attacker, attackChar, boost, turn) {
    for (let charKey in battleObj[battleKey][attacker].chars) {
        if (charKey == attackChar) {
            continue;
        }
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

        if (thisCharObj.resolve == 0) {
            continue;
        }

        let thisCharBaseObj = battleObj[battleKey][playerName].baseCharStats[charName];
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
            thisCharObj[stat] = round(thisCharBaseObj[stat] * multiplierObj[stat]);
            thisCharObj[stat] = Math.max(thisCharObj[stat], 0);
        }
    }
}

function addBuff(battleObj, battleKey, playerName, charName, buff, turn) {
    let numBuffs = battleObj[battleKey][playerName].chars[charName].buffs.length;
    switch (buff) {

        case 'Aspect Of Fire Mental':
            let AOFMentalBuff = 0.75;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "mental",
                amount: AOFMentalBuff
            });
            break;

        case 'Aspect Of Fire Physical':
            let AOFPhysicalBuff = 0.75;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "physical",
                amount: AOFPhysicalBuff
            });
            break;

        case 'Aspect Of Fire Social':
            let AOFSocialBuff = 0.75;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "social",
                amount: AOFSocialBuff
            });
            break;

        case 'Aspect Of Metal Mental':
            let AOMMentalBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "mental",
                amount: AOMMentalBuff
            });
            break;

        case 'Aspect Of Metal Physical':
            let AOMPhysicalBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "physical",
                amount: AOMPhysicalBuff
            });
            break;

        case 'Aspect Of Metal Social':
            let AOMSocialBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "social",
                amount: AOMSocialBuff
            });
            break;

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
        
        case 'Bottle Break Initiative':
            let bottleBreakInitiativeBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "initiative",
                amount: bottleBreakInitiativeBuff
            });
            break;

        case 'Bottle Break Social':
            let bottleBreakSocialBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "social",
                amount: bottleBreakSocialBuff
            });
            break;

        case 'Group Ties':
            let groupTiesBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "social",
                amount: groupTiesBuff
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

        case 'Teamwork':
            let teamworkBuff = 0.3;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 2,
                stat: "ability",
                amount: teamworkBuff
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

    if (battleObj[battleKey][playerName].chars[charName].buffs.length > numBuffs) {
        battleObj[battleKey].log(`${buff} added to ${playerName}'s ${charName}!`);
    }
}

function addDebuff(battleObj, battleKey, playerName, charName, debuff, turn) {
    let numDebuffs = battleObj[battleKey][playerName].chars[charName].debuffs.length;
    switch (debuff) {

        case 'Bottle Break Physical':
            let bottleBreakPhysicalDebuff = -0.25;
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "physical",
                amount: bottleBreakPhysicalDebuff
            });
            break;

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
    
    if (battleObj[battleKey][playerName].chars[charName].debuffs.length > numDebuffs) {
        battleObj[battleKey].log(`${debuff} added to ${playerName}'s ${charName}!`);
    }
}

function removeExpiredBuffs(battleObj, battleKey, playerName, charName, turn) {
    let thisCharObj = battleObj[battleKey][playerName].chars[charName];

    for (let i = 0; i < thisCharObj.buffs.length; i++) {
        let thisBuff = thisCharObj.buffs[i];

        if (thisBuff.endTurn == turn) {
            if (thisCharObj.resolve != 0) {
                battleObj[battleKey].log(`${playerName}'s ${charName}'s ${thisBuff.name} buff expired! ${thisBuff.stat} decreased by ${thisBuff.amount * 100}%`);
            }
            thisCharObj.buffs.splice(i, 1);
            i--;
        }
    }
}

function removeExpiredDebuffs(battleObj, battleKey, playerName, charName, turn) {
    let thisCharObj = battleObj[battleKey][playerName].chars[charName];

    for (let i = 0; i < thisCharObj.debuffs.length; i++) {
        let thisDebuff = thisCharObj.debuffs[i];

        if (thisDebuff.endTurn == turn) {
            if (thisCharObj.resolve != 0) {
                battleObj[battleKey].log(`${playerName}'s ${charName}'s ${thisDebuff.name} debuff expired! ${thisDebuff.stat} increased by ${thisDebuff.amount * -100}%`);
            }
            thisCharObj.debuffs.splice(i, 1);
            i--;
        }
    }
}