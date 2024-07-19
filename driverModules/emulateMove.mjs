//apply the effects of moves that impact boosts or statuses (except resolve)
import { addBoost, addBoostToAliveTeammates } from "./updateBoosts.mjs";
import { addStatus } from "./updateStatuses.mjs";
import { addInflictModifier, addReceiveModifier } from "./updateDamageModifiers.mjs";
import { round } from "./round.mjs";
import consts from '../consts.json' assert { type: 'json' };

export function emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, turnResults, turn, attackerResolves) {
    
    if (consts.moveInfo[move]?.type[0] == "attack" && battleObj[battleKey][defender].chars[defenseChar].moves.includes("Group Determination")) {
        for (let charKey in battleObj[battleKey][defender].chars) {
            if (battleObj[battleKey][defender].chars[charKey].resolve > 0) {
                addInflictModifier(battleObj, battleKey, defender, charKey, 0.05, turn, Infinity);
            }
        }
    }

    if (consts.moveInfo[move]?.type[0] == "attack" && battleObj[battleKey][attacker].chars[attackChar].moves.includes("Aspect Of Fire")) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Burning", turn, 1);
    }

    let attackerID = battleObj[battleKey][attacker].id;

    switch (move) {
        
        case 'Arrogance':
            addBoost(battleObj, battleKey, attacker, attackChar, "Arrogance", turn);
            break;

        case 'Blazing Form':
            addBoost(battleObj, battleKey, attacker, attackChar, "Blazing Form", turn);
            break;
        
        case 'Boss Orders':
            addBoostToAliveTeammates(battleObj, battleKey, attacker, attackChar, "Boss Orders", turn);
            break;
        
        case 'Bottle Break':
            addStatus(battleObj, battleKey, defender, defenseChar, "Wounded", turn, 1);
            nullifyBuffs(battleObj, battleKey, defender, defenseChar, turn);
            addBoost(battleObj, battleKey, attacker, attackChar, "Bottle Break Social", turn);
            addBoost(battleObj, battleKey, attacker, attackChar, "Bottle Break Initiative", turn);
            addBoost(battleObj, battleKey, attacker, attackChar, "Bottle Break Physical", turn);
            break;

        case 'Charm':
            addBoost(battleObj, battleKey, defender, defenseChar, "Charm", turn);
            if (typeof battleObj[battleKey][attacker].chars[attackChar].secrets === 'undefined') {
                battleObj[battleKey][attacker].chars[attackChar].secrets = new Set();
            }
            battleObj[battleKey][attacker].chars[attackChar].secrets.add(defenseChar);
            break;

        case 'Dominate':
            addBoost(battleObj, battleKey, attacker, attackChar, "Dominate", turn);
            break;
        
        case 'From The Shadows':
            addStatus(battleObj, battleKey, defender, defenseChar, "Trapped", turn, 3);
            
            let fromTheShadowsStr = `\\*\\*${attackChar}\\*\\* used \\*\\*From The Shadows\\*\\*!\\n\\*\\*.+\\*\\* is \\*\\*Trapped\\*\\* for 3 turns!\\n\\*\\*<@${attackerID}>\\*\\* tagged in \\*\\*(.+)\\*\\*!`;
            let fromTheShadowsRegex = new RegExp(fromTheShadowsStr);
            let fromTheShadowsMatch = fromTheShadowsRegex.exec(turnResults);

            if (fromTheShadowsMatch !== null) {
                let taggedInChar = fromTheShadowsMatch[1];
                addStatus(battleObj, battleKey, attacker, taggedInChar, "Pacified", turn, 1);
                addStatus(battleObj, battleKey, attacker, taggedInChar, "Invulnerable", turn, 1);
            }
            break;
        
        case 'Group Efforts':
            let thisCharBaseMental = battleObj[battleKey][attacker].baseCharStats[attackChar].mental;
            for (let charKey in battleObj[battleKey][attacker].chars) {
                if (battleObj[battleKey][attacker].chars[charKey].tags.includes("Ayanokōji Group")
                 && battleObj[battleKey][attacker].baseCharStats[charKey].mental < thisCharBaseMental) {
                    battleObj[battleKey][attacker].chars[charKey].mental = thisCharBaseMental;
                    battleObj[battleKey][attacker].baseCharStats[charKey].mental = thisCharBaseMental;
                }
            }
            break;

        case 'Group Ties':
            addBoostToAliveTeammates(battleObj, battleKey, attacker, attackChar, "Group Ties", turn);
            break;
        
        case 'Hate':
            addBoost(battleObj, battleKey, defender, defenseChar, "Hate", turn);
            break;
        
        case 'Humiliate':
            let humiliateStr = `\\*\\*${attackChar}\\*\\* used \\*\\*Humiliate\\*\\*!(\\n\\*\\*.+\\*\\*'s \\*\\*(.+)\\*\\* was weakened!)?\\n\\*\\*.+\\*\\* is \\*\\*(.+)\\*\\* for (\\d+) turns?!`;
            let humiliateRegex = new RegExp(humiliateStr);
            let humiliateMatch = humiliateRegex.exec(turnResults);

            if (humiliateMatch !== null) {
                let stat = humiliateMatch[2];
                if (typeof stat !== 'undefined') {
                    addBoost(battleObj, battleKey, defender, defenseChar, `Humiliate ${stat}`, turn);
                }
                let status = humiliateMatch[3];
                let numTurns = parseInt(humiliateMatch[4]);
                addStatus(battleObj, battleKey, defender, defenseChar, status, turn, numTurns);
            } else {
                //console.log(`No new status for ${defenseChar} was found in turn ${turn} of ${battleKey}`);
            }
            break;
        
        case 'Introversion':
            let [lowestResolveTeammate, lowestResolveTeammateObj] = 
                Object.entries(battleObj[battleKey][attacker].chars).reduce((minEntry, currentEntry) => {
                    return (currentEntry[0] != attackChar && currentEntry[1].resolve > 0 && currentEntry[1].resolve < minEntry[1].resolve) ? currentEntry : minEntry;
                }, ["empty", { resolve: 9999 }]);

            if (lowestResolveTeammate != "empty") {
                if (typeof attackerResolves !== 'undefined' && typeof attackerResolves[lowestResolveTeammate] != 'undefined' && attackerResolves[lowestResolveTeammate] != 0) {
                    console.log(`Program expected ${attacker}'s ${lowestResolveTeammate} in turn ${turn} of ${battleKey} to die, but they didn't.`);
                    console.log(attackerResolves);
                }

                for (let buff of lowestResolveTeammateObj.buffs) {
                    addBoost(battleObj, battleKey, attacker, attackChar, buff.name, buff.startTurn);
                }
                for (let inflictModifier of lowestResolveTeammateObj.inflictModifiers) {
                    addInflictModifier(battleObj, battleKey, attacker, attackChar, inflictModifier.amount, inflictModifier.startTurn, inflictModifier.numTurns);
                }
                for (let receiveModifier of lowestResolveTeammateObj.receiveModifiers) {
                    addReceiveModifier(battleObj, battleKey, attacker, attackChar, receiveModifier.amount, receiveModifier.startTurn, receiveModifier.numTurns);
                }
                for (let positiveStatus of lowestResolveTeammateObj.positiveStatuses) {
                    addStatus(battleObj, battleKey, attacker, attackChar, positiveStatus.name, positiveStatus.startTurn, positiveStatus.numTurns);
                }
                
                nullifyBuffs(battleObj, battleKey, attacker, lowestResolveTeammate, turn);
                for (let positiveStatus of battleObj[battleKey][attacker].chars[lowestResolveTeammate].positiveStatuses) {
                    positiveStatus.endTurn = turn;
                }

            }

            //note that you can only get the mental buff if you sacrifice a character
            //this works even if both players use the same character and both use Introversion,
            //because their counters are guaranteed to fail in that case
            if (turnResults.includes(`**${attackChar}** countered with **Introversion**!`)) {
                addBoost(battleObj, battleKey, attacker, attackChar, "Introversion", turn);
            }

            break;
        
        case 'Kabedon':
            //this works even if both players use the same character and both use Kabedon,
            //because their counters are guaranteed to fail in that case
            battleObj[battleKey][attacker].chars[attackChar].lockedMoves.push(move);
            if (turnResults.includes(`**${attackChar}** countered with **Kabedon**!`)) {
                addStatus(battleObj, battleKey, defender, defenseChar, "Stunned", turn, 1);
            } else if (turnResults.includes(`**${attackChar}'s** counter failed!`)) {
                addStatus(battleObj, battleKey, attacker, attackChar, "Stunned", turn, 1);
            }
            break;
        
        case 'Kings Command':
            let noAlivePawn = typeof battleObj[battleKey][attacker].chars.Pawn === 'undefined' || attackerResolves?.Pawn == 0;
            if (noAlivePawn) {
                let creatorBaseCharStats = battleObj[battleKey][attacker].baseCharStats[attackChar];
                let inheritAmount = 0.75;

                battleObj[battleKey][attacker].chars.Pawn = {
                    personality: "Timid",
                    moves: ["Scheming", "Athleticism", "Influence"],
                    tags: ["Persona"],
                    buffs: [],
                    debuffs: [],
                    positiveStatuses: [],
                    negativeStatuses: [],
                    inflictMultiplier: 1,
                    receiveMultiplier: 1,
                    inflictModifiers: [],
                    receiveModifiers: [],
                    lockedMoves: [],
                    rune: null,
                    aspectBoost: {
                        initiative: 0,
                        mental: 0,
                        physical: 0,
                        social: 0,
                        resolve: 0
                    },
                    initiative: round(creatorBaseCharStats.initiative * inheritAmount),
                    mental: round(creatorBaseCharStats.mental * inheritAmount),
                    physical: round(creatorBaseCharStats.physical * inheritAmount),
                    social: round(creatorBaseCharStats.social * inheritAmount),
                    resolve: round(creatorBaseCharStats.resolve * inheritAmount),
                    imageName: creatorBaseCharStats.imageName
                };
                battleObj[battleKey][attacker].baseCharStats.Pawn = structuredClone(battleObj[battleKey][attacker].chars.Pawn);
                addBoost(battleObj, battleKey, attacker, attackChar, "Kings Command", turn);
            }
            break;
        
        case 'Lead By Example':
            addBoost(battleObj, battleKey, attacker, attackChar, "1-turn Lead By Example", turn);
            addBoost(battleObj, battleKey, attacker, attackChar, "2-turn Lead By Example", turn);
            break;
        
        case 'Provoke':
            addStatus(battleObj, battleKey, defender, defenseChar, "Taunted", turn, 3);
            break;
        
        case 'Slap':
            addStatus(battleObj, battleKey, defender, defenseChar, "Wounded", turn, 3);
            break;
        
        case 'Slumber':
            addStatus(battleObj, battleKey, defender, defenseChar, "Pacified", turn, 1);
            addStatus(battleObj, battleKey, attacker, attackChar, "Resting", turn, 2);
            break;
        
        case 'Study':
            addBoost(battleObj, battleKey, attacker, attackChar, "Study Mental", turn);
            addBoost(battleObj, battleKey, attacker, attackChar, "Study Initiative", turn);
            break;
        
        case 'Teamwork':
            let previousTaggedInChar = battleObj[battleKey][attacker].previousTaggedInChar;
            let previousTaggedInCharObj = battleObj[battleKey][attacker].chars[previousTaggedInChar];
            if (previousTaggedInCharObj.tags.includes("Ayanokōji Group")) {
                addBoost(battleObj, battleKey, attacker, attackChar, "Teamwork", turn);
            }
            if (previousTaggedInChar.includes("Ayanokōji Kiyotaka")) {
                addStatus(battleObj, battleKey, attacker, attackChar, "Apathetic", turn, 2);
            }
            if (previousTaggedInChar.includes("Miyake Akito")) {
                addInflictModifier(battleObj, battleKey, attacker, attackChar, 0.25, turn, 2);
            }
            if (previousTaggedInChar.includes("Sakura Airi") || previousTaggedInChar == "Shizuku") {
                //this can be wrong in the case where one player tags into Hasebe from Airi and the other player
                //attacks with Hasebe, but overall this case isn't very important.
                if (turnResults.includes(`**${attackChar}** countered with **Airi Assist**!`)) {
                    addStatus(battleObj, battleKey, defender, defenseChar, "Pacified", turn, 2);
                    addStatus(battleObj, battleKey, defender, defenseChar, "Trapped", turn, 2);
                }
            }
            if (previousTaggedInChar.includes("Yukimura Keisei")) {
                nullifyBuffs(battleObj, battleKey, defender, defenseChar, turn);
            }
            break;

        case 'Unity':
            addBoost(battleObj, battleKey, attacker, attackChar, "Unity", turn);
            addBoostToAliveTeammates(battleObj, battleKey, attacker, attackChar, "Unity", turn);
            break;
        
        case 'Zenith Pace':
            addBoost(battleObj, battleKey, attacker, attackChar, "Zenith Pace", turn);
            break;
        
        default:
            break;
    }
}

export function emulateAction(battleObj, battleKey, attacker, defender, attackChar, defenseChar, action, turnResults, turn, attackerResolves) {

    switch (action) {

        case 'Defeat':
            if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("Boss Orders")) {
                emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Boss Orders", turnResults, turn, attackerResolves);
            }
            if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("Group Ties")) {
                emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Group Ties", turnResults, turn, attackerResolves);
            }
            break;

        case 'Game Start':
            if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("Group Efforts")) {
                emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Group Efforts", turnResults, turn, attackerResolves);
            }
            break;
        
        case 'Tag-in':
            let attackerPreviousTaggedInChar = battleObj[battleKey][attacker].previousTaggedInChar;
            let attackerPreviousTaggedInCharObj;
            if (attackerPreviousTaggedInChar !== null) {
                attackerPreviousTaggedInCharObj = battleObj[battleKey][attacker].chars[attackerPreviousTaggedInChar];
            }

            battleObj[battleKey][attacker].chars[attackChar].lockedMoves = [];
            
            if (attackerPreviousTaggedInChar !== null && attackerPreviousTaggedInCharObj.moves.includes("Lead By Example")) {
                emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Lead By Example", turnResults, turn, attackerResolves);
            }

            if (attackerPreviousTaggedInChar !== null && battleObj[battleKey][attacker].chars[attackChar].moves.includes("Teamwork")) {
                emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Teamwork", turnResults, turn, attackerResolves);
            }

            if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("The Perfect Existence")) {
                nullifyDebuffs(battleObj, battleKey, attacker, attackChar);
            }
            break;

    }
}

function nullifyBuffs(battleObj, battleKey, playerName, charName, turn) {
    for (let buff of battleObj[battleKey][playerName].chars[charName].buffs) {
        buff.endTurn = turn;
    }
    for (let inflictModifier of battleObj[battleKey][playerName].chars[charName].inflictModifiers) {
        inflictModifier.endTurn = turn;
    }
    for (let receiveModifier of battleObj[battleKey][playerName].chars[charName].receiveModifiers) {
        receiveModifier.endTurn = turn;
    }
}

function nullifyDebuffs(battleObj, battleKey, playerName, charName) {
    for (let debuff of battleObj[battleKey][playerName].chars[charName].debuffs) {
        debuff.endTurn = turn;
    }
}