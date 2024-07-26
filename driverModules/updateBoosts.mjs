// add or remove buffs or debuffs.
import { round } from './round.mjs';

export function addBoost(battleObj, battleKey, playerName, charName, boost, turn, canBeNullified=true) {
    // I arrange these alphabetically
    switch (boost) {

        case 'Affinity':
        case 'Arrogance':
        case 'Blazing Form':
        case 'Boss Orders':
        case 'Bottle Break Initiative':
        case 'Bottle Break Social':
        case 'Group Ties':
        case 'Glory Defeat':
        case 'Glory Initial':
        case 'Instinct':
        case 'Introversion':
        case '1-turn Lead By Example':
        case '2-turn Lead By Example':
        case 'Study Initiative':
        case 'Study Mental':
        case 'Teamwork':
        case 'The Perfect Existence':
        case 'Unity':
        case 'Zenith Pace':
            addBuff(battleObj, battleKey, playerName, charName, boost, turn, canBeNullified);
            break;
        
        case 'Bottle Break Physical':
        case 'Charm':
        case 'Dominate':
        case 'Hate':
        case 'Humiliate Mental':
        case 'Humiliate Physical':
        case 'Humiliate Social':
        case 'Kings Command':
            addDebuff(battleObj, battleKey, playerName, charName, boost, turn, canBeNullified);
            break;

        default:
            console.log(`${boost} isn't recognized as a boost.`);
            break;        
    }
}

// adds the specified boost to all members on the attacker's team (including the attacker themself)
// who have more than 0 resolve
export function addBoostToAliveTeammates(battleObj, battleKey, attacker, attackChar, boost, turn, canBeNullified=true) {
    for (let charKey in battleObj[battleKey][attacker].chars) {
        if (charKey == attackChar) {
            continue;
        }
        let charResolve = battleObj[battleKey][attacker].chars[charKey].resolve;
        if (charResolve > 0) {
            addBoost(battleObj, battleKey, attacker, charKey, boost, turn, canBeNullified);        
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
        let baseMultiplierObj = {
            'initiative': 1,
            'mental': 1,
            'physical': 1,
            'social': 1
        };

        for (let i = 0; i < thisCharObj.buffs.length; i++) {
            let buff = thisCharObj.buffs[i];
            if (buff.type == "base") {
                if (buff.stat == 'ability' ) {
                    baseMultiplierObj.initiative += buff.amount;
                    baseMultiplierObj.mental += buff.amount;
                    baseMultiplierObj.physical += buff.amount;
                    baseMultiplierObj.social += buff.amount;
                } else if (buff.stat == 'strength') {
                    baseMultiplierObj.mental += buff.amount;
                    baseMultiplierObj.physical += buff.amount;
                    baseMultiplierObj.social += buff.amount;
                } else {
                    baseMultiplierObj[buff.stat] += buff.amount;
                }
            }
        }

        for (let i = 0; i < thisCharObj.debuffs.length; i++) {
            let debuff = thisCharObj.debuffs[i];

            if (thisCharObj.moves.includes('Lead By Example') && (debuff.stat == 'ability' || debuff.stat == 'strength' || debuff.stat == 'physical')) {
                if (typeof battleObj[battleKey].log !== 'undefined') {
                    //battleObj[battleKey].log(`${debuff.name} debuff negated as it would lower ${charName}'s physical`);
                }
                thisCharObj.debuffs.splice(i, 1);
                i--;
                continue;
            }

            if (debuff.type == "base") {
                if (debuff.stat == 'ability') {
                    baseMultiplierObj.initiative += debuff.amount;
                    baseMultiplierObj.mental += debuff.amount;
                    baseMultiplierObj.physical += debuff.amount;
                    baseMultiplierObj.social += debuff.amount;
                } else if (debuff.stat == 'strength') {
                    baseMultiplierObj.mental += debuff.amount;
                    baseMultiplierObj.physical += debuff.amount;
                    baseMultiplierObj.social += debuff.amount;
                } else {
                    baseMultiplierObj[debuff.stat] += debuff.amount;
                }
            }
        }

        //applying base boosts
        for (let stat in baseMultiplierObj) {
            thisCharObj[stat] = round(thisCharBaseObj[stat] * baseMultiplierObj[stat]);
        }
        //applying total boosts
        for (let boost of [...thisCharObj.buffs, ...thisCharObj.debuffs]) {
            if (boost.type == "total") {
                if (boost.stat == "ability") {
                    thisCharObj.initiative = round(thisCharObj.initiative * (1 + boost.amount));
                    thisCharObj.mental = round(thisCharObj.mental * (1 + boost.amount));
                    thisCharObj.physical = round(thisCharObj.physical * (1 + boost.amount));
                    thisCharObj.social = round(thisCharObj.social * (1 + boost.amount));
                } else if (boost.stat == "strength") {
                    thisCharObj.mental = round(thisCharObj.mental * (1 + boost.amount));
                    thisCharObj.physical = round(thisCharObj.physical * (1 + boost.amount));
                    thisCharObj.social = round(thisCharObj.social * (1 + boost.amount));
                } else {
                    thisCharObj[boost.stat] = round(thisCharObj[boost.stat] * (1 + boost.amount));
                }
            }
        }
        //applying aspect boost
        for (let stat in thisCharObj.aspectBoost) {
            thisCharObj[stat] = round(thisCharObj[stat] * (1 + thisCharObj.aspectBoost[stat]));
        }
        //stats cannot be less than 0
        for (let stat of ['initiative', 'mental', 'physical', 'social']) {
            thisCharObj[stat] = Math.max(thisCharObj[stat], 0);
        }
    }
}

function addBuff(battleObj, battleKey, playerName, charName, buff, turn, canBeNullified) {
    let numBuffs = battleObj[battleKey][playerName].chars[charName].buffs.length;
    switch (buff) {

        case 'Affinity':
            let affinityBuff = 0.1;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "strength",
                type: "total",
                amount: affinityBuff,
                canBeNullified: canBeNullified
            });
            break;

        case 'Arrogance':
            let arroganceBuff = 0.4;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 2,
                stat: "ability",
                type: "base",
                amount: arroganceBuff,
                canBeNullified: canBeNullified
            });
            break;
        
        case 'Blazing Form':
            let blazingFormBuff = 0.2;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 5,
                stat: "physical",
                type: "base",
                amount: blazingFormBuff,
                canBeNullified: canBeNullified
            }); 
            break;

        case 'Boss Orders':
            let bossOrdersBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "mental",
                type: "base",
                amount: bossOrdersBuff,
                canBeNullified: canBeNullified
            }); 
            break;
        
        case 'Bottle Break Initiative':
            let bottleBreakInitiativeBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "initiative",
                type: "total",
                amount: bottleBreakInitiativeBuff,
                canBeNullified: canBeNullified
            });
            break;

        case 'Bottle Break Social':
            let bottleBreakSocialBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "social",
                type: "total",
                amount: bottleBreakSocialBuff,
                canBeNullified: canBeNullified
            });
            break;
        
        case 'Glory Defeat':
            let gloryDefeatBuff = 0.2;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "ability",
                type: "total",
                amount: gloryDefeatBuff,
                canBeNullified: canBeNullified
            });
            break;

        case 'Glory Initial':
            let gloryInitialBuff = 0.05;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "ability",
                type: "total",
                amount: gloryInitialBuff,
                canBeNullified: canBeNullified
            });
            break;

        case 'Group Ties':
            let groupTiesBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "social",
                type: "base",
                amount: groupTiesBuff,
                canBeNullified: canBeNullified
            }); 
            break;

        case 'Instinct':
            let instinctBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "initiative",
                type: "total",
                amount: instinctBuff,
                canBeNullified: canBeNullified
            }); 
            break;

        case 'Introversion':
            let introversionBuff = 0.6;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "mental",
                type: "base",
                amount: introversionBuff,
                canBeNullified: canBeNullified
            });                       
            break;

        case '1-turn Lead By Example':
            let leadByExampleBuff1 = 0.25;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 1,
                stat: "physical",
                type: "base",
                amount: leadByExampleBuff1,
                canBeNullified: canBeNullified
            }); 
            break;
        
        case '2-turn Lead By Example':
            let leadByExampleBuff2 = 0.25;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 2,
                stat: "physical",
                type: "base",
                amount: leadByExampleBuff2,
                canBeNullified: canBeNullified
            }); 
            break;
        
        case 'Study Initiative':
            let studyInitiativeBuff = 1;
            let hasStudyInitiativeBuff = hasBoost(battleObj, battleKey, playerName, charName, "Study Initiative");
            if (!hasStudyInitiativeBuff) {
                battleObj[battleKey][playerName].chars[charName].buffs.push({
                    name: buff,
                    startTurn: turn,
                    endTurn: turn + 1,
                    stat: "initiative",
                    type: "total",
                    amount: studyInitiativeBuff,
                    canBeNullified: canBeNullified
                });
            }
            break;
        
        case 'Study Mental':
            let studyMentalBuff = 1.5;
            let hasStudyMentalBuff = hasBoost(battleObj, battleKey, playerName, charName, "Study Mental");
            if (!hasStudyMentalBuff) {
                battleObj[battleKey][playerName].chars[charName].buffs.push({
                    name: buff,
                    startTurn: turn,
                    endTurn: turn + 1,
                    stat: "mental",
                    type: "base",
                    amount: studyMentalBuff,
                    canBeNullified: canBeNullified
                });
            }
            break;

        case 'Teamwork':
            let teamworkBuff = 0.3;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: turn + 2,
                stat: "ability",
                type: "total",
                amount: teamworkBuff,
                canBeNullified: canBeNullified
            });
            break;

        case 'The Perfect Existence':
            let thePerfectExistenceBuff = 0.5;
            battleObj[battleKey][playerName].chars[charName].buffs.push({
                name: buff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "ability",
                type: "total",
                amount: thePerfectExistenceBuff,
                canBeNullified: canBeNullified
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
                    type: "total",
                    amount: unityBuff,
                    canBeNullified: canBeNullified
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
                type: "base",
                amount: zenithPaceBuff,
                canBeNullified: canBeNullified
            })

        default:
            break;
    }

    if (battleObj[battleKey][playerName].chars[charName].buffs.length > numBuffs
     && typeof battleObj[battleKey].log !== 'undefined') {
        //battleObj[battleKey].log(`${buff} added to ${playerName}'s ${charName}!`);
    }
}

function addDebuff(battleObj, battleKey, playerName, charName, debuff, turn, canBeNullified) {
    let numDebuffs = battleObj[battleKey][playerName].chars[charName].debuffs.length;
    switch (debuff) {

        case 'Bottle Break Physical':
            let bottleBreakPhysicalDebuff = -0.1;
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "physical",
                type: "base",
                amount: bottleBreakPhysicalDebuff,
                canBeNullified: canBeNullified
            });
            break;

        case 'Charm':
            let charmDebuff = -0.33;
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: turn + 4,
                stat: "social",
                type: "base",
                amount: charmDebuff, 
                canBeNullified: canBeNullified
            })
            break;

        case 'Dominate':
            let dominateDebuff = -0.75;
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: turn + 5,
                stat: "ability",
                type: "base",
                amount: dominateDebuff, 
                canBeNullified: canBeNullified
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
                    type: "total",
                    amount: hateDebuff, 
                    canBeNullified: canBeNullified
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
                type: "base",
                amount: humiliateDebuff, 
                canBeNullified: canBeNullified
            }); 
            break;

        case 'Kings Command':
            let kingsCommandDebuff = -0.25;
            battleObj[battleKey][playerName].chars[charName].debuffs.push({
                name: debuff,
                startTurn: turn,
                endTurn: Infinity,
                stat: "ability",
                type: "total",
                amount: kingsCommandDebuff, 
                canBeNullified: canBeNullified
            }); 
            break;

        default:
            break;
    }
    
    if (battleObj[battleKey][playerName].chars[charName].debuffs.length > numDebuffs
     && typeof battleObj[battleKey].log !== 'undefined') {
        //battleObj[battleKey].log(`${debuff} added to ${playerName}'s ${charName}!`);
    }
}

function removeExpiredBuffs(battleObj, battleKey, playerName, charName, turn) {
    let thisCharObj = battleObj[battleKey][playerName].chars[charName];

    for (let i = 0; i < thisCharObj.buffs.length; i++) {
        let thisBuff = thisCharObj.buffs[i];

        if (thisBuff.endTurn == turn) {
            if (thisCharObj.resolve != 0 && typeof battleObj[battleKey].log !== 'undefined') {
                //battleObj[battleKey].log(`${playerName}'s ${charName}'s ${thisBuff.name} buff expired! ${thisBuff.stat} decreased by ${thisBuff.amount * 100}%`);
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
            if (thisCharObj.resolve != 0 && typeof battleObj[battleKey].log !== 'undefined') {
                //battleObj[battleKey].log(`${playerName}'s ${charName}'s ${thisDebuff.name} debuff expired! ${thisDebuff.stat} increased by ${thisDebuff.amount * -100}%`);
            }
            thisCharObj.debuffs.splice(i, 1);
            i--;
        }
    }
}