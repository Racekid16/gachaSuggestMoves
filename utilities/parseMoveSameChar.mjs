// determine whether the characters used a move that affects non-resolve stats, 
// where both players used the same character
import { addBoost, addBoostToAliveTeammates, hasBoost } from "./updateBoosts.mjs";
import { addStatus } from "./updateStatuses.mjs";

export function parseMoveSameChar(battleObj, p1name, p2name, charName, turnResults, turn, p1resolves, p2resolves) {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
    let p1previousTaggedInChar = battleObj[battleKey][p1name].previousTaggedInChar;
    let p2previousTaggedInChar = battleObj[battleKey][p2name].previousTaggedInChar;
    let p1ID = battleObj[battleKey][p1name].id;
    let p2ID = battleObj[battleKey][p2name].id;

    if (count(turnResults, `**${charName}** used **Arrogance**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Arrogance**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **Blazing Form**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Blazing Form**!`) == 2) {

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

    } else if (count(turnResults, `**${charName}** used **Charm**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **Dominate**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Dominate**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **From The Shadows**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **From The Shadows**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **Hate**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Hate**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **Humiliate**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Humiliate**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** is preparing **Introversion**...`) == 1) {

    } else if (count(turnResults, `**${charName}** is preparing **Introversion**...`) == 2) {

    }

    if (count(turnResults, `**${charName}** is preparing **Kabedon**...`) == 1) {

    } else if (count(turnResults, `**${charName}** is preparing **Kabedon**...`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **Kings Command**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Kings Command**!`) == 2) {

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

    } else if (count(turnResults, `**${charName}** used **Provoke**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **Slap**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Slap**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **Slumber**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Slumber**!`) == 2) {

    }

    if (count(turnResults, `**${charName}** used **Study**!`) == 1) {

    } else if (count(turnResults, `**${charName}** used **Study**!`) == 2) {

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

    } else if (count(turnResults, `**${charName}** used **Unity**!`) == 2) {

    }

    if (battleObj[battleKey][p1name].chars[charName].moves.includes("Zenith Pace")) {
        if (count(turnResults, `**${charName}**'s **Initiative** was boosted!`) == 1) {

        } else if (count(turnResults, `**${charName}**'s **Initiative** was boosted!`) == 2) {

        }
    }

}

// return how many times subStr appears in str (non-overlapping)
function count(str, subStr) {
    let parts = str.split(subStr);
    return parts.length - 1;
}