// determine whether the characters used a move that affects non-resolve stats, 
// where both players used the same character
import { emulateMove } from './emulateMove.mjs';
import { addBoost } from './updateBoosts.mjs';
import { hasStatus } from './updateStatuses.mjs';
import consts from '../consts.json' assert { type: 'json' };

export function parseMoveSameChar(battleObj, p1name, p2name, charName, battleEmbed, turn, 
                                  p1resolves, p2resolves, p1taggedIn, p2taggedIn) {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
    let battleKey = p1name + "_vs._" + p2name;
    let turnResults = battleEmbed.fields[2].value;
    let resolvesObj = {};
    resolvesObj[p1name] = p1resolves;
    resolvesObj[p2name] = p2resolves;

    let p1previousTaggedInChar = battleObj[battleKey][p1name].previousTaggedInChar;
    let p2previousTaggedInChar = battleObj[battleKey][p2name].previousTaggedInChar;
    let p1ID = battleObj[battleKey][p1name].id;
    let p2ID = battleObj[battleKey][p2name].id;

    if (p1previousTaggedInChar !== null && battleObj[battleKey][p1name].chars[p1previousTaggedInChar].moves.includes("Boss Orders") 
     && p1resolves[p1previousTaggedInChar] == 0) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Boss Orders", turnResults, turn, p1resolves);
    }
    if (p2previousTaggedInChar !== null && battleObj[battleKey][p2name].chars[p2previousTaggedInChar].moves.includes("Boss Orders") 
     && p2resolves[p2previousTaggedInChar] == 0) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Boss Orders", turnResults, turn, p2resolves);
    }

    if (turnResults.includes(`**<@${p1ID}>** tagged in **${charName}**!`) && p1previousTaggedInChar !== null 
     && battleObj[battleKey][p1name].chars[p1previousTaggedInChar].moves.includes("Lead By Example")) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Lead By Example", turnResults, turn, p1resolves);
    }
    if (turnResults.includes(`**<@${p2ID}>** tagged in **${charName}**!`) && p2previousTaggedInChar !== null 
     && battleObj[battleKey][p2name].chars[p1previousTaggedInChar].moves.includes("Lead By Example")) {
        emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Lead By Example", turnResults, turn, p2resolves);
    }

    let taggedInStr = `\\*\\*<@${p1ID}>\\**\\** tagged in \\*\\*(.+)\\*\\*!`;
    let taggedInRegex = new RegExp(taggedInStr);
    let taggedInMatch = taggedInRegex.exec(turnResults);
    if (taggedInMatch !== null) {
        let taggedInChar = taggedInMatch[1];
        emulateMove(battleObj, battleKey, p1name, p2name, taggedInChar, charName, "Tag-in", turnResults, turn, p1resolves);
    }
    taggedInStr = `\\*\\*<@${p2ID}>\\**\\** tagged in \\*\\*(.+)\\*\\*!`;
    taggedInRegex = new RegExp(taggedInStr);
    taggedInMatch = taggedInRegex.exec(turnResults);
    if (taggedInMatch !== null) {
        let taggedInChar = taggedInMatch[1];
        emulateMove(battleObj, battleKey, p2name, p1name, taggedInChar, charName, "Tag-in", turnResults, turn, p2resolves);
    }

    if (battleObj[battleKey][p1name].chars[charName].moves.includes("Zenith Pace") && p1previousTaggedInChar !== null) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Zenith Pace", turnResults, turn, p2resolves);
    }
    if (battleObj[battleKey][p2name].chars[charName].moves.includes("Zenith Pace") && p2previousTaggedInChar !== null) {
        emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Zenith Pace", turnResults, turn, p2resolves);
    }

    for (let move of ['Arrogance', 'Blazing Form', 'Charm', 'Dominate', 'From The Shadows', 'Hate',
                      'Kings Command', 'Provoke', 'Slap', 'Slumber', 'Study', 'Unity']) {
        if (count(turnResults, `**${charName}** used **${move}**!`) == 1) {
            emulateAffectingMoveAndOther(battleObj, p1name, p2name, charName, battleEmbed, turn, p1resolves, p2resolves, p1taggedIn, p2taggedIn, move);
            return;
        } else if (count(turnResults, `**${charName}** used **${move}**!`) == 2) {
            emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, move, turnResults, turn, p1resolves);
            emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, move, turnResults, turn, p2resolves);
            return;
        }
    }

    if (count(turnResults, `**${charName}** used **Humiliate**!`) == 1) {
        emulateAffectingMoveAndOther(battleObj, p1name, p2name, charName, battleEmbed, turn, p1resolves, p2resolves, p1taggedIn, p2taggedIn, "Humiliate");
        return;
    } else if (count(turnResults, `**${charName}** used **Humiliate**!`) == 2) {
        addBoost(battleObj, battleKey, p1name, charName, "Humiliate", turn);
        addBoost(battleObj, battleKey, p2name, charName, "Humiliate", turn);
        console.log(`Unable to determine what statuses were inflicted on each player in ${turn} of ${battleKey} (1)`);
    }

    if (count(turnResults, `**${charName}** is preparing **Introversion**...`) == 1) {
        emulateAffectingMoveAndOther(battleObj, p1name, p2name, charName, battleEmbed, turn, p1resolves, p2resolves, p1taggedIn, p2taggedIn, "Introversion");
        return;
    } else if (count(turnResults, `**${charName}** is preparing **Introversion**...`) == 2) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Introversion", turnResults, turn, p1resolves);
        emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Introversion", turnResults, turn, p2resolves);
        return;      
    }

    if (count(turnResults, `**${charName}** is preparing **Kabedon**...`) == 1) {
        console.log(`Unable to determine which player used Kabedon in turn ${turn} of ${battleKey}`);
        return;
    } else if (count(turnResults, `**${charName}** is preparing **Kabedon**...`) == 2) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Kabedon", turnResults, turn, p1resolves);
        emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Kabedon", turnResults, turn, p2resolves);
        return;
    }
}

// determine what character the player is used for this turn
export function getCurrentChar(playerNumber, battleEmbed) {
    let taggedInCharRegex = /__(.+)__/;
    let charName = taggedInCharRegex.exec(battleEmbed.fields[playerNumber - 1].value)?.[1];

    if (typeof charName === 'undefined') {
        return null;
    } 
    return charName;
}

// return how many times subStr appears in str (non-overlapping)
function count(str, subStr) {
    let parts = str.split(subStr);
    return parts.length - 1;
}

//returns the name of the player who used affectingMove, and then the name of the other player
//this function assumes that charName does not have the Impulse move
//we also assume for now that both players' charName have the same initiative and used the same
//attack + boost/status affecting move
function emulateAffectingMoveAndOther(battleObj, p1name, p2name, charName, battleEmbed, turn, p1resolves, p2resolves, p1taggedIn, p2taggedIn, affectingMove) {
    let battleKey = p1name + "_vs._" + p2name;
    let turnResults = battleEmbed.fields[2].value;
    let resolvesObj = {};
    resolvesObj[p1name] = p1resolves;
    resolvesObj[p2name] = p2resolves;
    
    let [attacker, defender] = determineIfPlayerUnableToMove(battleObj, p1name, p2name, charName, battleEmbed, p1taggedIn, p2taggedIn);
    if (attacker != false) {
        emulateMove(battleObj, battleKey, attacker, defender, charName, charName, affectingMove, turnResults, turn, resolvesObj[attacker]);
        return;
    }

    if (typeof p1resolves[charName] == 'undefined') {
        switch (charName) {
            case 'Perfect Kōenji Rokusuke': p1resolves['Perfect Kōenji Rokusuke'] = 0; break;
            case 'True Kushida Kikyō': p1resolves['True Kushida Kikyō'] = p1resolves['Unmasked Kushida Kikyō']; break;
            case 'Unmasked Kushida Kikyō': p1resolves['Unmasked Kushida Kikyō'] = p1resolves['True Kushida Kikyō']; break;
        }
    }
    if (typeof p2resolves[charName] === 'undefined') {
        switch (charName) {
            case 'Perfect Kōenji Rokusuke': p2resolves['Perfect Kōenji Rokusuke'] = 0; break;
            case 'True Kushida Kikyō': p2resolves['True Kushida Kikyō'] = p2resolves['Unmasked Kushida Kikyō']; break;
            case 'Unmasked Kushida Kikyō': p2resolves['Unmasked Kushida Kikyō'] = p2resolves['True Kushida Kikyō']; break;
        }
    }

    let validMoves = battleObj[battleKey][p1name].chars[charName].moves
        .filter(move => move != affectingMove && !consts.moveInfo[move].type.includes("innate"));

    //if the program made it here, assume that both players made a move, but made different moves. 
    //only time this isn't the case is when both players have the same initiative and one killed the other.
    //note: invulnerable players take 0 damage
    for (let move of validMoves) {
        if (turnResults.includes(`**${charName}** used **${move}**!`)
         || turnResults.includes(`**${charName}** is preparing **${move}**...`)) {
            determineWhichPlayerUsedWhichMove(battleObj, p1name, p2name, charName, battleEmbed, turn, p1resolves, p2resolves, affectingMove, move);
        }
    }
}

function determineIfPlayerUnableToMove(battleObj, p1name, p2name, charName, battleEmbed, p1taggedIn, p2taggedIn) {
    let battleKey = p1name + "_vs._" + p2name;

    if (p1taggedIn) {
        return [p2name, p1name];
    }
    if (p2taggedIn) {
        return [p1name, p2name];
    }

    let p1charDead = getCurrentChar(1, battleEmbed) === null;
    let p2charDead = getCurrentChar(2, battleEmbed) === null;
    let p1initiative = battleObj[battleKey][p1name].chars[charName].initiative;
    let p2initiative = battleObj[battleKey][p2name].chars[charName].initiative;
    if (p2initiative < p1initiative && p2charDead) {
        return [p1name, p2name];
    }
    if (p1initiative < p2initiative && p1charDead) {
        return [p1name, p2name];
    }

    if (hasStatus(battleObj, battleKey, p1name, charName, "stunned")) {
        return [p2name, p1name];
    }
    if (hasStatus(battleObj, battleKey, p2name, charName, "stunned")) {
        return [p1name, p2name];
    }

    let charAttackMoves = battleObj[battleKey][p1name].chars[charName].moves
        .map(affectingMove => consts.moveInfo[affectingMove])
        .filter(moveObj => moveObj.type.includes("attack"));
    if (charAttackMoves.length == 0) {
        if (hasStatus(battleObj, battleKey, p1name, charName, "taunted") ) {
            return [p2name, p1name];
        }
        if (hasStatus(battleObj, battleKey, p2name, charName, "taunted") ) {
            return [p1name, p2name];
        }
    }

    let charNonAttackMoves = battleObj[battleKey][p1name].chars[charName].moves
        .map(affectingMove => consts.moveInfo[affectingMove])
        .filter(moveObj => !moveObj.type.includes("attack") && !moveObj.type.includes("innate"));
    if (charNonAttackMoves.length == 0) {
        if (hasStatus(battleObj, battleKey, p1name, charName, "pacified") ) {
            return [p2name, p1name];
        }
        if (hasStatus(battleObj, battleKey, p2name, charName, "pacified") ) {
            return [p1name, p2name];
        }
    }

    return [false, false];
}

//affectingMove and otherMove are guaranteed to be different.
function determineWhichPlayerUsedWhichMove(battleObj, p1name, p2name, charName, battleEmbed, turn, p1resolves, p2resolves, affectingMove, otherMove) {
    let battleKey = p1name + "_vs._" + p2name; 
    let turnResults = battleEmbed.fields[2].value;    
    let affectingMoveObj = consts.moveInfo[affectingMove];
    affectingMoveObj.name = affectingMove;
    let otherMoveObj = consts.moveInfo[otherMove];
    otherMoveObj.name = otherMove;
    let p1resolveDiff = p1resolves[charName] - battleObj[battleKey][p1name].chars[charName].resolve;
    let p2resolveDiff = p2resolves[charName] - battleObj[battleKey][p2name].chars[charName].resolve;

    let moves = [affectingMoveObj, otherMoveObj].sort((a, b) => a.type[0].localeCompare(b.type[0]));

    if (moves[0].name == "Kings Command" || moves[1].name == "Kings Command") {
        let otherMoveName = moves[0].name == "Kings Command" ? moves[1].name : moves[0].name;

        if (typeof p1resolves.Pawn !== 'undefined' && p1resolves.Pawn > 0 
        && (typeof battleObj[battleKey][p1name].chars.Pawn === 'undefined' || battleObj[battleKey][p1name].chars.Pawn.resolve == 0)) {
            emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Kings Command", turnResults, turn, p1resolves);
            emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, otherMoveName, turnResults, turn, p2resolves);
            return;
        }
        if (typeof p2resolves.Pawn !== 'undefined' && p2resolves.Pawn > 0 
        && (typeof battleObj[battleKey][p2name].chars.Pawn === 'undefined' || battleObj[battleKey][p2name].chars.Pawn.resolve == 0)) {
            emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Kings Command", turnResults, turn, p2resolves);
            emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, otherMoveName, turnResults, turn, p1resolves);
            return;
        }
        console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (1)`);
        return;
    }

    if (moves[0].name == "From The Shadows" || moves[1].name == "From The Shadows") {
        let otherMoveName = moves[0].name == "From The Shadows" ? moves[1].name : moves[0].name;

        let fromTheShadowsStr = `\\*\\*${charName}\\*\\* used \\*\\*From The Shadows\\*\\*!\\n\\*\\*.+\\*\\* is \\*\\*Trapped\\*\\* for 3 turns!\\n\\*\\*<@(\\d+)>\\*\\* tagged in \\*\\*(.+)\\*\\*!`;
        let fromTheShadowsRegex = new RegExp(fromTheShadowsStr);
        let fromTheShadowsMatch = fromTheShadowsRegex.exec(turnResults);
        if (fromTheShadowsMatch !== null) {
            let playerID = fromTheShadowsMatch[1];

            if (battleObj[battleKey][p1name].id == playerID) {
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "From The Shadows", turnResults, turn, p1resolves);
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, otherMoveName, turnResults, turn, p2resolves);
                return;
            }
            if (battleObj[battleKey][p2name].id == playerID) {
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "From The Shadows", turnResults, turn, p2resolves);
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, otherMoveName, turnResults, turn, p1resolves);
                return;
            }
            console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (2)`);
            return;
        }
    }

    if (moves[0].name == "Introversion" || moves[1].name == "Introversion") {
        let otherMoveName = moves[0].name == "Introversion" ? moves[1].name : moves[0].name;

        let introversionStr = `\\*\\*(.+)\\*\\* took \\*\\*9999\\*\\* damage!`;
        let introversionRegex = new RegExp(introversionStr);
        let introversionMatch = introversionRegex.exec(turnResults);
 
        if (introversionMatch !== null) {
            let sacrifiedChar = introversionMatch[1];

            if (p1resolves[sacrifiedChar] == 0 && battleObj[battleKey][p1name].chars[sacrifiedChar].resolve != 0) {
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Introversion", turnResults, turn, p1resolves);
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, otherMoveName, turnResults, turn, p2resolves);
                return;
            }
            if (p2resolves[sacrifiedChar] == 0 && battleObj[battleKey][p2name].chars[sacrifiedChar].resolve != 0) {
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Introversion", turnResults, turn, p2resolves);
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, otherMoveName, turnResults, turn, p1resolves);
                return;
            }
            console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (3)`);
            return;
        }
    }

    if (moves[0].name == "Unity" || moves[1].name == "Unity") {
        let otherMoveName = moves[0].name == "Unity" ? moves[1].name : moves[0].name;

        let unityStr = `\\*\\*${charName}\\*\\* used \\*\\*Unity\\*\\*!(\\n\\*\\*(.+)\\*\\*'s \\*\\*Ability\\*\\* was boosted!)?(\\n\\*\\*(.+)\\*\\*'s \\*\\*Ability\\*\\* was boosted!)?(\\n\\*\\*(.+)\\*\\*'s \\*\\*Ability\\*\\* was boosted!)?`
        let unityRegex = new RegExp(unityStr);
        let unityMatch = unityRegex.exec(turnResults);

        let boostedChars = [];
        for (let index of [2, 4, 6]) {
            if (typeof unityMatch[index] !== 'undefined') {
                boostedChars.push(unityMatch[index])
            }
        }

        for (let char of boostedChars) {
            if (typeof battleObj[battleKey][p2name].chars[char] === 'undefined' && typeof p2resolves[char] === 'undefined') {
                emulateMove(battleObj, battleKey, p1name, p1name, charName, charName, "Unity", turnResults, turn, p1resolves);
                emulateMove(battleObj, battleKey, p2name, p2name, charName, charName, otherMoveName, turnResults, turn, p2resolves);
                return;
            }
        }

        for (let char of boostedChars) {
            if (typeof battleObj[battleKey][p1name].chars[char] === 'undefined' && typeof p1resolves[char] === 'undefined') {
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Unity", turnResults, turn, p2resolves);
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, otherMoveName, turnResults, turn, p1resolves);
                return;
            }
        }
    }

    if (moves[1].type[0] == 'vitalize') {
        let vitalizeStr = `\\*\\*${charName}\\*\\* used \\*\\*${moves[1].name}\\*\\*!\\n\\*\\*(.+)\\*\\* recovered \\*\\*(\\d+)\\*\\* Resolve!(\\n\\*\\*(.+)\\*\\* recovered \\*\\*(\\d+)\\*\\* Resolve!)?`;
        let vitalizeRegex = new RegExp(vitalizeStr);
        let vitalizeMatch = vitalizeRegex.exec(turnResults);
        var move2vitalize = {};
        move2vitalize[charName] = 0;
        if (typeof vitalizeMatch[1] !== 'undefined') {
            move2vitalize[vitalizeMatch[1]] = parseInt(vitalizeMatch[2]);
        }
        if (typeof vitalizeMatch[4] !== 'undefined') {
            move2vitalize[vitalizeMatch[4]] = parseInt(vitalizeMatch[5]);
        }
        var move2vitalizedCharsObj = Object.fromEntries(
            Object.entries(move2vitalize).filter(([key, value]) => value != 0)
        );
        var move2vitalizedChars = Object.keys(move2vitalizedCharsObj);
    }

    if (moves[0].type[0] == 'attack') {
        let move1str = `\\*\\*${charName}\\*\\* used \\*\\*${moves[0].name}\\*\\*!\\n(\\*\\*CRITICAL HIT!!\\*\\*\\n)?\\*\\*.+\\*\\* took \\*\\*(\\d+)\\*\\* damage!`;
        let move1regex = new RegExp(move1str);
        let move1match = move1regex.exec(turnResults);
        if (typeof move1match === null) {
            console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (4)`);
            return;
        }
        moves[0].damage = parseInt(move1match[1]) * -1;

        //moves[0].type[0] == 'attack' && moves[1].type[0] == 'attack'
        if (moves[1].type[0] == 'attack') { 
            let move2str = `\\*\\*${charName}\\*\\* used \\*\\*${moves[1].name}\\*\\*!\\n(\\*\\*CRITICAL HIT!!\\*\\*\\n)?\\*\\*.+\\*\\* took \\*\\*(\\d+)\\*\\* damage!`;
            let move2regex = new RegExp(move2str);
            let move2match = move2regex.exec(turnResults);
            if (typeof move2match === null) {
                console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (5)`);
                return;
            }
            moves[1].damage = parseInt(move2match[1]) * -1;
            if (p1resolveDiff == p2resolveDiff) {
                console.log(`Unable to determine who used ${affectingMove} in turn ${turn} of ${battleKey} (1)`);
                return;
            }
            if ((moves[0].damage == p2resolveDiff) || (moves[1].damage == p1resolveDiff)) {
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[0].name, turnResults, turn, p1resolves);
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[1].name, turnResults, turn, p2resolves);
                return;
            }
            if ((moves[1].damage == p2resolveDiff) || (moves[0].damage == p1resolveDiff)) {
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[0].name, turnResults, turn, p2resolves);
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[1].name, turnResults, turn, p1resolves);
                return;
            }
            console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (6)`);
            return;
        }

        //moves[0].type[0] == 'attack' && moves[1].type[0] == 'vitalize'
        if (moves[1].type[0] == 'vitalize') {
            let p1charDead = getCurrentChar(1, battleEmbed) === null;
            let p2charDead = getCurrentChar(2, battleEmbed) === null;
            if (p2charDead) {
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[0].name, turnResults, turn, p1resolves);
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[1].name, turnResults, turn, p2resolves);
                return;
            }
            if (p1charDead) {
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[0].name, turnResults, turn, p2resolves);
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[1].name, turnResults, turn, p1resolves);
                return;
            }

            //else both characters are alive
            let vitalizerResolveDiff = move2vitalize[charName] + moves[0].damage;
            if (vitalizerResolveDiff == 0) {
                console.log(`Unable to determine who used ${affectingMove} in turn ${turn} of ${battleKey} (2)`);
                return;
            }
            if (p2resolveDiff == vitalizerResolveDiff) {
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[0].name, turnResults, turn, p1resolves);
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[1].name, turnResults, turn, p2resolves);
                return;
            }
            if (p1resolveDiff == vitalizerResolveDiff) {
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[0].name, turnResults, turn, p2resolves);
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[1].name, turnResults, turn, p1resolves);
                return;
            }
            console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (7)`);
            return;
        }

        //moves[0].type[0] == 'attack' && moves[1].type[0] != 'attack' && moves[1].type[0] != 'vitalize'
        if (p1resolveDiff == 0) {
            emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[0].name, turnResults, turn, p1resolves);
            emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[1].name, turnResults, turn, p2resolves);
            return;
        }
        if (p2resolveDiff == 0) {
            emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[0].name, turnResults, turn, p2resolves);
            emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[1].name, turnResults, turn, p1resolves);
            return;
        }
        console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (8)`);
        return;
    }

    if (moves[1].type[0] == 'vitalize') {
        //moves[0].type[0] == 'vitalize' && moves[1].type[0] == 'vitalize'
        if (moves[0].type[0] == 'vitalize') {
            let vitalizeStr = `\\*\\*${charName}\\*\\* used \\*\\*${moves[0].name}\\*\\*!\\n\\*\\*(.+)\\*\\* recovered \\*\\*(\\d+)\\*\\* Resolve!(\\n\\*\\*(.+)\\*\\* recovered \\*\\*(\\d+)\\*\\* Resolve!)?`;
            let vitalizeRegex = new RegExp(vitalizeStr);
            let vitalizeMatch = vitalizeRegex.exec(turnResults);
            let move1vitalize = {};
            move1vitalize[charName] = 0;
            if (typeof vitalizeMatch[1] !== 'undefined') {
                move1vitalize[vitalizeMatch[1]] = parseInt(vitalizeMatch[2]);
            }
            if (typeof vitalizeMatch[4] !== 'undefined') {
                move1vitalize[vitalizeMatch[4]] = parseInt(vitalizeMatch[5]);
            }
            let move1vitalizedCharsObj = Object.fromEntries(
                Object.entries(move1vitalize).filter(([key, value]) => value != 0)
            );
            let move1vitalizedChars = Object.keys(move1vitalizedCharsObj);

            if (JSON.stringify(move1vitalizedCharsObj) == JSON.stringify(move2vitalizedCharsObj)) {
                console.log(`Unable to determine who used ${affectingMove} in turn ${turn} of ${battleKey} (3)`);
                return;
            }

            if (move1vitalizedChars.length != 0 || move2vitalizedChars.length != 0) {
                if (move1vitalizedChars.every(char => p1resolves[char] - battleObj[battleKey][p1name].chars[char]?.resolve == move1vitalizedCharsObj[char])
                 && move2vitalizedChars.every(char => p2resolves[char] - battleObj[battleKey][p2name].chars[char]?.resolve == move2vitalizedCharsObj[char])) {
                    emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[0].name, turnResults, turn, p1resolves);
                    emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[1].name, turnResults, turn, p2resolves);
                    return;
                }
                if (move1vitalizedChars.every(char => p2resolves[char] - battleObj[battleKey][p2name].chars[char]?.resolve == move1vitalizedCharsObj[char])
                 && move2vitalizedChars.every(char => p1resolves[char] - battleObj[battleKey][p1name].chars[char]?.resolve == move2vitalizedCharsObj[char])) {
                    emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[0].name, turnResults, turn, p2resolves);
                    emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[1].name, turnResults, turn, p1resolves);
                    return;
                }
                console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (9)`);
                return;
            } 
        }

        //moves[0].type[0] != 'vitalize' && moves[0].type[0] != 'attack' && moves[1].type[0] == 'vitalize'
        if (move2vitalizedChars.length != 0) {
            if (move2vitalizedChars.every(char => p2resolves[char] - battleObj[battleKey][p2name].chars[char]?.resolve == move2vitalizedCharsObj[char])) {
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[0].name, turnResults, turn, p1resolves);
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[1].name, turnResults, turn, p2resolves);
                return;
            }
            if (move2vitalizedChars.every(char => p1resolves[char] - battleObj[battleKey][p1name].chars[char]?.resolve == move2vitalizedCharsObj[char])) {
                emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, moves[0].name, turnResults, turn, p2resolves);
                emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, moves[1].name, turnResults, turn, p1resolves);
                return;
            }
            console.log(`The program unexpectedly reached here on turn ${turn} of ${battleKey} (10)`);
            return;
        }
    }

    //neither move is attack or vitalize
    console.log(`Unable to determine who used ${affectingMove} in turn ${turn} of ${battleKey} (4)`);
}