//apply the effects of moves that impact boosts or statuses (except resolve)
import { addBoost, addBoostToAliveTeammates, hasBoost } from "./updateBoosts.mjs";
import { addStatus } from "./updateStatuses.mjs";
import { round } from "./round.mjs";

export function emulateMove(battleObj, battleKey, attacker, defender, attackChar, defenseChar, move, turnResults, turn, attackerResolves) {
    switch (move) {
        case 'Arrogance':
            addBoost(battleObj, battleKey, attacker, attackChar, "Arrogance", turn);
            break;

        case 'Blazing Form':
            addBoost(battleObj, battleKey, attacker, attackChar, "Blazing Form", turn);
            break;
        
        case 'Boss Orders':
            addBoostToAliveTeammates(battleObj, battleKey, attacker, "Boss Orders", turn);
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
            
            let attackerID = battleObj[battleKey][attacker].id;
            let fromTheShadowsStr = `\\*\\*${attackChar}\\*\\* used \\*\\*From The Shadows\\*\\*!\\n\\*\\*.+\\*\\* is \\*\\*Trapped\\*\\* for 3 turns!\\n\\*\\*<@${attackerID}>\\*\\* tagged in \\*\\*(.+)\\*\\*!`;
            let fromTheShadowsRegex = new RegExp(fromTheShadowsStr);
            let fromTheShadowsMatch = fromTheShadowsRegex.exec(turnResults);

            if (fromTheShadowsMatch !== null) {
                let taggedInChar = fromTheShadowsMatch[1];
                addStatus(battleObj, battleKey, attacker, taggedInChar, "Pacified", turn, 1);
                addStatus(battleObj, battleKey, attacker, taggedInChar, "Invulnerable", turn, 1);
            }
            break;
        
        case 'Hate':
            addBoost(battleObj, battleKey, defender, defenseChar, "Hate", turn);
            break;
        
        case 'Humiliate':
            addBoost(battleObj, battleKey, defender, defenseChar, "Humiliate", turn);
            let statusStr = `\\*\\*${attackChar}\\*\\* used \\*\\*Humiliate\\*\\*!\\n(\\*\\*.+\\*\\*'s \\*\\*.+\\*\\* was weakened!\\n)?\\*\\*.+\\*\\* is \\*\\*(.+)\\*\\* for (\\d+) turns?!`;
            let statusRegex = new RegExp(statusStr);
            let statusMatch = statusRegex.exec(turnResults);

            if (statusMatch !== null) {
                let status = statusMatch[2];
                let numTurns = parseInt(statusMatch[3]);
                addStatus(battleObj, battleKey, defender, defenseChar, status, turn, numTurns);
            } else {
                console.log(`No new status for ${defenseChar} was found in turn ${turn} of ${battleKey}`);
            }
            break;
        
        case 'Introversion':
            let [lowestResolveTeammateName, lowestResolveTeammate] = 
                Object.entries(battleObj[battleKey][attacker].chars).reduce((minEntry, currentEntry) => {
                    return (currentEntry[0] != attackChar && currentEntry[1].resolve > 0 && currentEntry[1].resolve < minEntry[1].resolve) ? currentEntry : minEntry;
                }, ["empty", { resolve: Infinity }]);

            if (lowestResolveTeammateName != "empty") {
                if (attackerResolves[lowestResolveTeammateName] != 0) {
                    console.log(`Program expected ${attacker}'s ${lowestResolveTeammateName} in ${battleKey} to die, but they didn't.`);
                }

                for (let buff of lowestResolveTeammate.buffs) {
                    addBoost(battleObj, battleKey, attacker, attackChar, buff.name, buff.startTurn);
                }
            }

            //this works even if both players use the same character and both use Introversion,
            //because their counters are guaranteed to fail in that case
            if (turnResults.includes(`**${attackChar}** countered with **Introversion**!`)) {
                addBoost(battleObj, battleKey, attacker, attackChar, "Introversion", turn);
            }

            break;
        
        case 'Kabedon':
            //this works even if both players use the same character and both use Kabedon,
            //because their counters are guaranteed to fail in that case
            battleObj[battleKey][attacker].chars[attackChar].canUseKabedon = false;
            if (turnResults.includes(`**${attackChar}** countered with **Kabedon**!`)) {
                addStatus(battleObj, battleKey, defender, defenseChar, "Stunned", turn, 1);
            } else if (turnResults.includes(`**${attackChar}'s** counter failed!`)) {
                addStatus(battleObj, battleKey, attacker, attackChar, "Stunned", turn, 1);
            }
            break;
        
        case 'Kings Command':
            let noAlivePawn = typeof battleObj[battleKey][attacker].chars.Pawn === 'undefined' || attackerResolves.Pawn == 0;
            if (noAlivePawn) {
                let creatorInitialStats = battleObj[battleKey][attacker].initialCharStats[attackChar];
                let inheritAmount = 0.75;

                battleObj[battleKey][attacker].chars.Pawn = {
                    personality: "Timid",
                    moves: ["Scheming", "Athleticism", "Influence"],
                    tags: ["Persona"],
                    buffs: [],
                    debuffs: [],
                    positiveStatuses: [],
                    negativeStatuses: [],
                    priority: 0,
                    initiative: round(creatorInitialStats.initiative * inheritAmount),
                    mental: round(creatorInitialStats.mental * inheritAmount),
                    physical: round(creatorInitialStats.physical * inheritAmount),
                    social: round(creatorInitialStats.social * inheritAmount),
                    resolve: round(creatorInitialStats.resolve * inheritAmount)
                };
                battleObj[battleKey][attacker].initialCharStats.Pawn = structuredClone(battleObj[battleKey][attacker].chars.Pawn);
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
        
        case 'Tag-in':
            if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("Kabedon")) {
                battleObj[battleKey][attacker].chars[attackChar].canUseKabedon = true;
            }
            if (battleObj[battleKey][attacker].chars[attackChar].moves.includes("The Perfect Existence")) {
                for (let debuff of battleObj[battleKey][attacker].chars[attackChar].debuffs) {
                    debuff.endTurn = turn;
                }
            }
            break;

        case 'Unity':
            addBoostToAliveTeammates(battleObj, battleKey, attacker, "Unity", turn);
            break;
        
        case 'Zenith Pace':
            addBoost(battleObj, battleKey, attacker, attackChar, "Zenith Pace", turn);
            break;
        
        default:
            break;
    }
}