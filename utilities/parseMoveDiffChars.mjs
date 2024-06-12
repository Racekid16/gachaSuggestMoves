// determine whether the characters used a move that affects non-resolve stats, 
// where both players used a different character
import { addBoost, addBoostToAliveTeammates, hasBoost } from "./updateBoosts.mjs";
import { addStatus } from "./updateStatuses.mjs";

export function parseMoveDifferentChars(battleObj, battleKey, attacker, defender, attackChar, 
                                 defenseChar, turnResults, turn, attackerResolves) {
    let attackerID = battleObj[battleKey][attacker].id;
    let previousTaggedInChar = battleObj[battleKey][attacker].previousTaggedInChar;

    if (turnResults.includes(`**${attackChar}** used **Arrogance**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Arrogance", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Blazing Form**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Blazing Form", turn);
    }

    if (previousTaggedInChar !== null && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Boss Orders") 
     && attackerResolves[previousTaggedInChar] == 0) {
        addBoostToAliveTeammates(battleObj, battleKey, attacker, "Boss Orders", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Charm**!`)) {
        addBoost(battleObj, battleKey, defender, defenseChar, "Charm", turn);
        if (typeof battleObj[battleKey][attacker].chars[attackChar].secrets === 'undefined') {
            battleObj[battleKey][attacker].chars[attackChar].secrets = new Set();
        }
        battleObj[battleKey][attacker].chars[attackChar].secrets.add(defenseChar);
    }

    if (turnResults.includes(`**${attackChar}** used **Dominate**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Dominate", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **From The Shadows**!`)) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Trapped", turn, 3);
        
        let fromTheShadowsStr = `\\*\\*${attackChar}\\*\\* used \\*\\*From The Shadows\\*\\*!\\n\\*\\*.+\\*\\* is \\*\\*Trapped\\*\\* for 3 turns!\\n\\*\\*<@${attackerID}>\\*\\* tagged in \\*\\*(.+)\\*\\*!`;
        let fromTheShadowsRegex = new RegExp(fromTheShadowsStr);
        let fromTheShadowsMatch = fromTheShadowsRegex.exec(turnResults);

        if (fromTheShadowsMatch !== null) {
            let taggedInChar = fromTheShadowsMatch[1];
            addStatus(battleObj, battleKey, attacker, taggedInChar, "Pacified", turn, 1);
            addStatus(battleObj, battleKey, attacker, taggedInChar, "Invulnerable", turn, 1);
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Hate**!`)) {
        let defenderHasHateDebuff = hasBoost(battleObj, battleKey, defender, defenseChar, "Hate");
        if (!defenderHasHateDebuff) {
            addBoost(battleObj, battleKey, defender, defenseChar, "Hate", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Humiliate**!`)) {
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
    }

    if (turnResults.includes(`**${attackChar}** is preparing **Introversion**...`)) {
        let [lowestResolveTeammateName, lowestResolveTeammate] = 
            Object.entries(battleObj[battleKey][attacker].chars).reduce((minEntry, currentEntry) => {
                return (currentEntry[0] != attackChar && currentEntry[1].resolve > 0 && currentEntry[1].resolve < minEntry[1].resolve) ? currentEntry : minEntry;
            }, ["empty", { resolve: Infinity }]
        );

        if (lowestResolveTeammateName != "empty") {
            if (attackerResolves[lowestResolveTeammateName] != 0) {
                console.log(`Program expected ${attacker}'s ${lowestResolveTeammateName} in ${battleKey} to die, but they didn't.`);
            }

            for (let buff of lowestResolveTeammate.buffs) {
                addBoost(battleObj, battleKey, attacker, attackChar, buff.name, buff.startTurn);
            }
        }

        if (turnResults.includes(`**${attackChar}** countered with **Introversion**!`)) {
            addBoost(battleObj, battleKey, attacker, attackChar, "Introversion", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}** is preparing **Kabedon**...`)) {
        battleObj[battleKey][attacker].chars[attackChar].canUseKabedon = false;
        if (turnResults.includes(`**${attackChar}** countered with **Kabedon**!`)) {
            addStatus(battleObj, battleKey, defender, defenseChar, "Stunned", turn, 1);
        } else if (turnResults.includes(`**${attackChar}'s** counter failed!`)) {
            addStatus(battleObj, battleKey, attacker, attackChar, "Stunned", turn, 1);
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Kings Command**!\n**${attackChar}** summoned a **Pawn**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Kings Command", turn);
    }

    if (turnResults.includes(`**<@${attackerID}>** tagged in **${attackChar}**!`) && previousTaggedInChar !== null 
     && battleObj[battleKey][attacker].chars[previousTaggedInChar].moves.includes("Lead By Example")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "1-turn Lead By Example", turn);
        addBoost(battleObj, battleKey, attacker, attackChar, "2-turn Lead By Example", turn);
    }

    if (turnResults.includes(`**${attackChar}** used **Provoke**!`)) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Taunted", turn, 3);
    }
    
    if (turnResults.includes(`**${attackChar}** used **Slap**!`)) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Wounded", turn, 3);
    }

    if (turnResults.includes(`**${attackChar}** used **Slumber**!`)) {
        addStatus(battleObj, battleKey, defender, defenseChar, "Pacified", turn, 1);
        addStatus(battleObj, battleKey, attacker, attackChar, "Resting", turn, 2);
    }

    if (turnResults.includes(`**${attackChar}** used **Study**!`)) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Study Initiative", turn);
        addBoost(battleObj, battleKey, attacker, attackChar, "Study Mental", turn);
    }

    // handle both The Perfect Existence and Kabedon tagging in here
    let taggedInStr = `\\*\\*<@${attackerID}>\\**\\** tagged in \\*\\*(.+)\\*\\*!`;
    let taggedInRegex = new RegExp(taggedInStr);
    let taggedInMatch = taggedInRegex.exec(turnResults);
    if (taggedInMatch !== null) {
        let taggedInChar = taggedInMatch[1];
        if (battleObj[battleKey][attacker].chars[taggedInChar].moves.includes("Kabedon")) {
            battleObj[battleKey][attacker].chars[taggedInChar].canUseKabedon = true;
        }
        if (battleObj[battleKey][attacker].chars[taggedInChar].moves.includes("The Perfect Existence")) {
            for (let debuff of battleObj[battleKey][attacker].chars[taggedInChar].debuffs) {
                debuff.endTurn = turn;
            }
        }
    }

    if (turnResults.includes(`**${attackChar}** used **Unity**!`)) {
        let attackerHasUnityBuff = hasBoost(battleObj, battleKey, attacker, attackChar, "Unity");
        if (!attackerHasUnityBuff) {
            addBoostToAliveTeammates(battleObj, battleKey, attacker, "Unity", turn);
        }
    }

    if (turnResults.includes(`**${attackChar}**'s **Initiative** was boosted!`)
     && battleObj[battleKey][attacker].chars[attackChar].moves.includes("Zenith Pace")) {
        addBoost(battleObj, battleKey, attacker, attackChar, "Zenith Pace", turn);
    }
}