//apply the effects of moves that impact boosts or statuses (except resolve)
import { addBoost, addBoostToAliveTeammates } from "./updateBoosts.mjs";
import { addStatus, hasStatus } from "./updateStatuses.mjs";
import { addInflictModifier, addReceiveModifier } from "./updateDamageModifiers.mjs";
import { addFieldEffect } from "./updateFieldEffects.mjs";
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
        addStatus(battleObj, battleKey, defender, defenseChar, "burning", turn, 1);
    }

    if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("Aspect Of Water")) {
        let lockRegex = /\*\*(.+)\*\* had their \*\*(.+)\*\* locked!/;
        let lockMatch = lockRegex.exec(turnResults);
        if (lockMatch !== null && lockMatch[1] != attackChar) {
            battleObj[battleKey][defender].chars[defenseChar].lockedMoves.push(lockMatch[2]);
        }
    }

    let attackCharRune = battleObj[battleKey][attacker].chars[attackChar].rune;
    if (attackCharRune == "Focus" || attackCharRune == "Instinct") {
        for (let otherMove of battleObj[battleKey][attacker].chars[attackChar].moves) {
            if (otherMove != move && !consts.moveInfo[otherMove].type.includes("innate")
             && !battleObj[battleKey][attacker].chars[attackChar].lockedMoves.includes(move)) {
                battleObj[battleKey][attacker].chars[attackChar].lockedMoves.push(move);
            }
        }
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
            addStatus(battleObj, battleKey, defender, defenseChar, "wounded", turn, 1);
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
            addStatus(battleObj, battleKey, defender, defenseChar, "trapped", turn, 3);
            
            let fromTheShadowsStr = `\\*\\*${attackChar}\\*\\* used \\*\\*From The Shadows\\*\\*!\\n\\*\\*.+\\*\\* is \\*\\*trapped\\*\\* for 3 turns!\\n\\*\\*<@${attackerID}>\\*\\* tagged in \\*\\*(.+)\\*\\*!`;
            let fromTheShadowsRegex = new RegExp(fromTheShadowsStr);
            let fromTheShadowsMatch = fromTheShadowsRegex.exec(turnResults);

            if (fromTheShadowsMatch !== null) {
                let taggedInChar = fromTheShadowsMatch[1];
                addStatus(battleObj, battleKey, attacker, taggedInChar, "pacified", turn, 1);
                addStatus(battleObj, battleKey, attacker, taggedInChar, "invulnerable", turn, 1);
            }
            break;
        
        case 'Frozen World':
            addFieldEffect(battleObj, battleKey, "Frozen World", turn, 5);
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

            if (attackerResolves[attackChar] != 0 && lowestResolveTeammate != "empty") {
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
            if (turnResults.includes(`**${attackChar}** countered with **${move}**!`)) {
                addBoost(battleObj, battleKey, attacker, attackChar, "Introversion", turn);
            }

            break;
        
        case 'Kabedon':
            //this works even if both players use the same character and both use Kabedon,
            //because their counters are guaranteed to fail in that case
            battleObj[battleKey][attacker].chars[attackChar].lockedMoves.push(move);
            if (turnResults.includes(`**${attackChar}** countered with **${move}**!`)) {
                addStatus(battleObj, battleKey, defender, defenseChar, "stunned", turn, 1);
            } else if (turnResults.includes(`**${attackChar}'s** counter failed!`)) {
                addStatus(battleObj, battleKey, attacker, attackChar, "stunned", turn, 1);
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
                    rune: "None",
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
                if (battleObj[battleKey][attacker].chars[attackChar].rune == "Summoning") {
                    battleObj[battleKey][attacker].chars.Pawn.mental = round(battleObj[battleKey][attacker].chars.Pawn.mental * 1.5);
                    battleObj[battleKey][attacker].chars.Pawn.physical = round(battleObj[battleKey][attacker].chars.Pawn.physical * 1.5);
                    battleObj[battleKey][attacker].chars.Pawn.social = round(battleObj[battleKey][attacker].chars.Pawn.social * 1.5);
                }
                battleObj[battleKey][attacker].baseCharStats.Pawn = structuredClone(battleObj[battleKey][attacker].chars.Pawn);
                addBoost(battleObj, battleKey, attacker, attackChar, "Kings Command", turn);
            }
            break;
        
        case 'Lead By Example':
            addBoost(battleObj, battleKey, attacker, attackChar, "1-turn Lead By Example", turn);
            addBoost(battleObj, battleKey, attacker, attackChar, "2-turn Lead By Example", turn);
            break;
        
        case 'Provoke':
            addStatus(battleObj, battleKey, defender, defenseChar, "taunted", turn, 3);
            break;

        case 'Reckless Abandon':
            addInflictModifier(battleObj, battleKey, attacker, attackChar, 0.33, 1, Infinity, false);
            break;
        
        case 'Slap':
            addStatus(battleObj, battleKey, defender, defenseChar, "wounded", turn, 3);
            break;
        
        case 'Slumber':
            addStatus(battleObj, battleKey, defender, defenseChar, "pacified", turn, 1);
            addStatus(battleObj, battleKey, attacker, attackChar, "resting", turn, 2);
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
                addStatus(battleObj, battleKey, attacker, attackChar, "apathetic", turn, 2);
            }
            if (previousTaggedInChar.includes("Miyake Akito")) {
                addInflictModifier(battleObj, battleKey, attacker, attackChar, 0.25, turn, 2);
            }
            if (previousTaggedInChar.includes("Sakura Airi") || previousTaggedInChar == "Shizuku") {
                //this can be wrong in the case where one player tags into Hasebe from Airi and the other player
                //attacks with Hasebe, but overall this case isn't very important.
                if (turnResults.includes(`**${attackChar}** countered with **Airi Assist**!`)) {
                    addStatus(battleObj, battleKey, defender, defenseChar, "pacified", turn, 2);
                    addStatus(battleObj, battleKey, defender, defenseChar, "trapped", turn, 2);
                }
            }
            if (previousTaggedInChar.includes("Yukimura Keisei")) {
                nullifyBuffs(battleObj, battleKey, defender, defenseChar, turn);
            }
            break;

        case 'Thrill Of The Chase':
            nullifyDebuffs(battleObj, battleKey, attacker, attackChar);
            if (turnResults.includes(`**${attackChar}** countered with **${move}**!`)) {
                addStatus(battleObj, battleKey, attacker, attackChar, "hunter", turn, 3, false);
            } else {
                addStatus(battleObj, battleKey, attacker, attackChar, "hunter", turn, 1, false);
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
            if (battleObj[battleKey][defender].chars[defenseChar].rune == "Glory") {
                addBoost(battleObj, battleKey, defender, defenseChar, "Glory Defeat", turn, false);
            }
            if (hasStatus(battleObj, battleKey, defender, defenseChar, "hunter")) {
                let hunterStatusIndex = battleObj[battleKey][defender].chars[defenseChar].positiveStatuses.findIndex(obj => obj.name == "hunter");
                battleObj[battleKey][defender].chars[defenseChar].positiveStatuses[hunterStatusIndex].endTurn += 2;
            }
            break;

        case 'Game Start':
            if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("Group Efforts")) {
                emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Group Efforts", turnResults, turn, attackerResolves);
            }
            if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("Reckless Abandon")) {
                emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, "Reckless Abandon", turnResults, turn, attackerResolves);
            }
            break;
        
        case 'Switch-in':
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
        if (buff.canBeNullified) {
            buff.endTurn = turn;
        }
    }
    for (let inflictModifier of battleObj[battleKey][playerName].chars[charName].inflictModifiers) {
        if (inflictModifier.canBeNullified) {
            inflictModifier.endTurn = turn;
        }
    }
    for (let receiveModifier of battleObj[battleKey][playerName].chars[charName].receiveModifiers) {
        if (receiveModifier.canBeNullified) {
            receiveModifier.endTurn = turn;
        }
    }
}

function nullifyDebuffs(battleObj, battleKey, playerName, charName) {
    for (let debuff of battleObj[battleKey][playerName].chars[charName].debuffs) {
        if (debuff.canBeNullified) {
            debuff.endTurn = turn;
        }
    }
}