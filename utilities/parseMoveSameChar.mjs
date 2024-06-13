// determine whether the characters used a move that affects non-resolve stats, 
// where both players used the same character
import { addBoost, addBoostToAliveTeammates, hasBoost } from "./updateBoosts.mjs";
import { addStatus } from "./updateStatuses.mjs";

export function parseMoveSameChar(battleObj, p1name, p2name, charName, turnResults, turn, 
                                  p1resolves, p2resolves, p1taggedIn, p2taggedIn) {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
    let battleKey = p1name + "_vs._" + p2name;

    let p1previousTaggedInChar = battleObj[battleKey][p1name].previousTaggedInChar;
    let p2previousTaggedInChar = battleObj[battleKey][p2name].previousTaggedInChar;
    let p1ID = battleObj[battleKey][p1name].id;
    let p2ID = battleObj[battleKey][p2name].id;

    if (count(turnResults, `**${charName}** used **Arrogance**!`) == 1) {
        //TODO
        let playerID = determineWhoUsedMove(battleObj, p1name, p2name, charName, turnResults, turn, 
                                            p1resolves, p2resolves, p1taggedIn, p2taggedIn, "Arrogance");
    } else if (count(turnResults, `**${charName}** used **Arrogance**!`) == 2) {
        addBoost(battleObj, battleKey, p1name, charName, "Arrogance", turn);
        addBoost(battleObj, battleKey, p2name, charName, "Arrogance", turn);
    }

    if (count(turnResults, `**${charName}** used **Blazing Form**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Blazing Form**!`) == 2) {
        addBoost(battleObj, battleKey, p1name, charName, "Blazing Form", turn);
        addBoost(battleObj, battleKey, p2name, charName, "Blazing Form", turn);
    }

    if (p1previousTaggedInChar !== null && battleObj[battleKey][p1name].chars[p1previousTaggedInChar].moves.includes("Boss Orders") 
     && p1resolves[p1previousTaggedInChar] == 0) {
        addBoostToAliveTeammates(battleObj, battleKey, p1name, "Boss Orders", turn);
    }
    if (p2previousTaggedInChar !== null && battleObj[battleKey][p2name].chars[p2previousTaggedInChar].moves.includes("Boss Orders") 
     && p2resolves[p2previousTaggedInChar] == 0) {
        addBoostToAliveTeammates(battleObj, battleKey, p2name, "Boss Orders", turn);
    }

    if (count(turnResults, `**${charName}** used **Charm**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Charm**!`) == 2) {
        addBoost(battleObj, battleKey, p1name, charName, "Charm", turn);
        if (typeof battleObj[battleKey][p1name].chars[charName].secrets === 'undefined') {
            battleObj[battleKey][p1name].chars[charName].secrets = new Set();
        }
        battleObj[battleKey][p1name].chars[charName].secrets.add(charName);

        addBoost(battleObj, battleKey, p2name, charName, "Charm", turn);
        if (typeof battleObj[battleKey][p2name].chars[charName].secrets === 'undefined') {
            battleObj[battleKey][p2name].chars[charName].secrets = new Set();
        }
        battleObj[battleKey][p2name].chars[charName].secrets.add(charName);
    }

    if (count(turnResults, `**${charName}** used **Dominate**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Dominate**!`) == 2) {
        addBoost(battleObj, battleKey, p1name, charName, "Dominate", turn);
        addBoost(battleObj, battleKey, p2name, charName, "Dominate", turn);
    }

    if (count(turnResults, `**${charName}** used **From The Shadows**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **From The Shadows**!`) == 2) {
        addStatus(battleObj, battleKey, p2name, charName, "Trapped", turn, 3);
        let fromTheShadowsStr = `\\*\\*${charName}\\*\\* used \\*\\*From The Shadows\\*\\*!\\n\\*\\*.+\\*\\* is \\*\\*Trapped\\*\\* for 3 turns!\\n\\*\\*<@${p1ID}>\\*\\* tagged in \\*\\*(.+)\\*\\*!`;
        let fromTheShadowsRegex = new RegExp(fromTheShadowsStr);
        let fromTheShadowsMatch = fromTheShadowsRegex.exec(turnResults);
        if (fromTheShadowsMatch !== null) {
            let taggedInChar = fromTheShadowsMatch[1];
            addStatus(battleObj, battleKey, p1name, taggedInChar, "Pacified", turn, 1);
            addStatus(battleObj, battleKey, p1name, taggedInChar, "Invulnerable", turn, 1);
        }

        addStatus(battleObj, battleKey, p1name, charName, "Trapped", turn, 3);
        fromTheShadowsStr = `\\*\\*${charName}\\*\\* used \\*\\*From The Shadows\\*\\*!\\n\\*\\*.+\\*\\* is \\*\\*Trapped\\*\\* for 3 turns!\\n\\*\\*<@${p2ID}>\\*\\* tagged in \\*\\*(.+)\\*\\*!`;
        fromTheShadowsRegex = new RegExp(fromTheShadowsStr);
        fromTheShadowsMatch = fromTheShadowsRegex.exec(turnResults);
        if (fromTheShadowsMatch !== null) {
            let taggedInChar = fromTheShadowsMatch[1];
            addStatus(battleObj, battleKey, p2name, taggedInChar, "Pacified", turn, 1);
            addStatus(battleObj, battleKey, p2name, taggedInChar, "Invulnerable", turn, 1);
        }
    }

    if (count(turnResults, `**${charName}** used **Hate**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Hate**!`) == 2) {
        let p2hasHateDebuff = hasBoost(battleObj, battleKey, p2name, charName, "Hate");
        if (!p2hasHateDebuff) {
            addBoost(battleObj, battleKey, p2name, charName, "Hate", turn);
        }

        let p1hasHateDebuff = hasBoost(battleObj, battleKey, p1name, charName, "Hate");
        if (!p1hasHateDebuff) {
            addBoost(battleObj, battleKey, p1name, charName, "Hate", turn);
        }
    }

    if (count(turnResults, `**${charName}** used **Humiliate**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Humiliate**!`) == 2) {
        //TODO
    }

    if (count(turnResults, `**${charName}** is preparing **Introversion**...`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** is preparing **Introversion**...`) == 2) {
        //both counters will fail
        let [lowestResolveTeammateName, lowestResolveTeammate] = 
            Object.entries(battleObj[battleKey][p1name].chars).reduce((minEntry, currentEntry) => {
                return (currentEntry[0] != charName && currentEntry[1].resolve > 0 && currentEntry[1].resolve < minEntry[1].resolve) ? currentEntry : minEntry;
            }, ["empty", { resolve: Infinity }]
        );
        if (lowestResolveTeammateName != "empty") {
            if (p1Resolves[lowestResolveTeammateName] != 0) {
                console.log(`Program expected ${p1name}'s ${lowestResolveTeammateName} in ${battleKey} to die, but they didn't.`);
            }
            for (let buff of lowestResolveTeammate.buffs) {
                addBoost(battleObj, battleKey, p1name, charName, buff.name, buff.startTurn);
            }
        }

        [lowestResolveTeammateName, lowestResolveTeammate] = 
            Object.entries(battleObj[battleKey][p2name].chars).reduce((minEntry, currentEntry) => {
                return (currentEntry[0] != charName && currentEntry[1].resolve > 0 && currentEntry[1].resolve < minEntry[1].resolve) ? currentEntry : minEntry;
            }, ["empty", { resolve: Infinity }]
        );
        if (lowestResolveTeammateName != "empty") {
            if (p2Resolves[lowestResolveTeammateName] != 0) {
                console.log(`Program expected ${p2name}'s ${lowestResolveTeammateName} in ${battleKey} to die, but they didn't.`);
            }
            for (let buff of lowestResolveTeammate.buffs) {
                addBoost(battleObj, battleKey, p2name, charName, buff.name, buff.startTurn);
            }
        }
    }

    if (count(turnResults, `**${charName}** is preparing **Kabedon**...`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** is preparing **Kabedon**...`) == 2) {
        //both counters will fail
        battleObj[battleKey][p1name].chars[charName].canUseKabedon = false;
        addStatus(battleObj, battleKey, p1name, charName, "Stunned", turn, 1);
        battleObj[battleKey][p2name].chars[charName].canUseKabedon = false;
        addStatus(battleObj, battleKey, p2name, charName, "Stunned", turn, 1);
    }

    if (count(turnResults, `**${charName}** used **Kings Command**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Kings Command**!`) == 2) {
        addBoost(battleObj, battleKey, p1name, charName, "Kings Command", turn);
        addBoost(battleObj, battleKey, p2name, charName, "Kings Command", turn);
    }

    if (turnResults.includes(`**<@${p1ID}>** tagged in **${charName}**!`) && p1previousTaggedInChar !== null 
     && battleObj[battleKey][p1name].chars[p1previousTaggedInChar].moves.includes("Lead By Example")) {
        addBoost(battleObj, battleKey, p1name, charName, "1-turn Lead By Example", turn);
        addBoost(battleObj, battleKey, p1name, charName, "2-turn Lead By Example", turn);
    }
    if (turnResults.includes(`**<@${p2ID}>** tagged in **${charName}**!`) && p2previousTaggedInChar !== null 
     && battleObj[battleKey][p2name].chars[p1previousTaggedInChar].moves.includes("Lead By Example")) {
        addBoost(battleObj, battleKey, p2name, charName, "1-turn Lead By Example", turn);
        addBoost(battleObj, battleKey, p2name, charName, "2-turn Lead By Example", turn);
    }

    if (count(turnResults, `**${charName}** used **Provoke**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Provoke**!`) == 2) {
        addStatus(battleObj, battleKey, p2name, charName, "Taunted", turn, 3);
        addStatus(battleObj, battleKey, p1name, charName, "Taunted", turn, 3);
    }

    if (count(turnResults, `**${charName}** used **Slap**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Slap**!`) == 2) {
        addStatus(battleObj, battleKey, p1name, charName, "Wounded", turn, 3);
        addStatus(battleObj, battleKey, p2name, charName, "Wounded", turn, 3);
    }

    if (count(turnResults, `**${charName}** used **Slumber**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Slumber**!`) == 2) {
        addStatus(battleObj, battleKey, p2name, charName, "Pacified", turn, 1);
        addStatus(battleObj, battleKey, p1name, charName, "Resting", turn, 2);
        addStatus(battleObj, battleKey, p1name, charName, "Pacified", turn, 1);
        addStatus(battleObj, battleKey, p2name, charName, "Resting", turn, 2);
    }

    if (count(turnResults, `**${charName}** used **Study**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Study**!`) == 2) {
        addBoost(battleObj, battleKey, p1name, charName, "Study Initiative", turn);
        addBoost(battleObj, battleKey, p1name, charName, "Study Mental", turn);
        addBoost(battleObj, battleKey, p2name, charName, "Study Initiative", turn);
        addBoost(battleObj, battleKey, p2name, charName, "Study Mental", turn);
    }

    // handle both The Perfect Existence and Kabedon tagging in here
    let taggedInStr = `\\*\\*<@${p1ID}>\\**\\** tagged in \\*\\*(.+)\\*\\*!`;
    let taggedInRegex = new RegExp(taggedInStr);
    let taggedInMatch = taggedInRegex.exec(turnResults);
    if (taggedInMatch !== null) {
        let taggedInChar = taggedInMatch[1];
        if (battleObj[battleKey][p1name].chars[taggedInChar].moves.includes("Kabedon")) {
            battleObj[battleKey][p1name].chars[taggedInChar].canUseKabedon = true;
        }
        if (battleObj[battleKey][p1name].chars[taggedInChar].moves.includes("The Perfect Existence")) {
            for (let debuff of battleObj[battleKey][p1name].chars[taggedInChar].debuffs) {
                debuff.endTurn = turn;
            }
        }
    }
    taggedInStr = `\\*\\*<@${p2ID}>\\**\\** tagged in \\*\\*(.+)\\*\\*!`;
    taggedInRegex = new RegExp(taggedInStr);
    taggedInMatch = taggedInRegex.exec(turnResults);
    if (taggedInMatch !== null) {
        let taggedInChar = taggedInMatch[1];
        if (battleObj[battleKey][p2name].chars[taggedInChar].moves.includes("Kabedon")) {
            battleObj[battleKey][p2name].chars[taggedInChar].canUseKabedon = true;
        }
        if (battleObj[battleKey][p2name].chars[taggedInChar].moves.includes("The Perfect Existence")) {
            for (let debuff of battleObj[battleKey][p2name].chars[taggedInChar].debuffs) {
                debuff.endTurn = turn;
            }
        }
    }

    if (count(turnResults, `**${charName}** used **Unity**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Unity**!`) == 2) {
        let p1HasUnityBuff = hasBoost(battleObj, battleKey, p1name, charName, "Unity");
        if (!p1HasUnityBuff) {
            addBoostToAliveTeammates(battleObj, battleKey, p1name, "Unity", turn);
        }

        let p2HasUnityBuff = hasBoost(battleObj, battleKey, p2name, charName, "Unity");
        if (!p2HasUnityBuff) {
            addBoostToAliveTeammates(battleObj, battleKey, p2name, "Unity", turn);
        }
    }

    if (battleObj[battleKey][p1name].chars[charName]?.moves.includes("Zenith Pace")) {
        if (count(turnResults, `**${charName}**'s **Initiative** was boosted!`) == 1) {
            //TODO
        } else if (count(turnResults, `**${charName}**'s **Initiative** was boosted!`) == 2) {
            addBoost(battleObj, battleKey, p1name, charName, "Zenith Pace", turn);
            addBoost(battleObj, battleKey, p2name, charName, "Zenith Pace", turn);
        }
    }
}

// return how many times subStr appears in str (non-overlapping)
function count(str, subStr) {
    let parts = str.split(subStr);
    return parts.length - 1;
}

function determineWhoUsedMove(battleObj, p1name, p2name, charName, turnResults, turn, 
                              p1resolves, p2resolves, p1taggedIn, p2taggedIn, moveName) {
    let battleKey = p1name + "_vs._" + p2name;
    let p1ID = battleObj[battleKey][p1name].id;
    let p2ID = battleObj[battleKey][p2name].id;

    if (p1taggedIn) {
        return p2ID;
    }
    if (p2taggedIn) {
        return p1ID;
    }

    for (let move of battleObj[battleKey][p1name].chars[charName].moves) {
        
    }
}