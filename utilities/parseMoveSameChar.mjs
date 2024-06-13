// determine whether the characters used a move that affects non-resolve stats, 
// where both players used the same character
import { emulateMove } from './emulateMove.mjs';
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

    for (let move of ['Arrogance', 'Blazing Form', 'Charm', 'Dominate', 'From The Shadows', 'Hate',
                      'Kings Command', 'Provoke', 'Slap', 'Slumber', 'Study', 'Unity']) {
        if (count(turnResults, `**${charName}** used **${move}**!`) == 1) {
            let [attacker, defender] = determineWhoUsedMove(battleObj, p1name, p2name, charName, battleEmbed,
                                                            p1resolves, p2resolves, p1taggedIn, p2taggedIn, move);
            emulateMove(battleObj, battleKey, attacker, defender, charName, charName, move, turnResults, turn, resolvesObj[attacker]);
        } else if (count(turnResults, `**${charName}** used **${move}**!`) == 2) {
            emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, move, turnResults, turn, p1resolves);
            emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, move, turnResults, turn, p2resolves);
        }
    }

    if (p1previousTaggedInChar !== null && battleObj[battleKey][p1name].chars[p1previousTaggedInChar].moves.includes("Boss Orders") 
     && p1resolves[p1previousTaggedInChar] == 0) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Boss Orders", turnResults, turn, p1resolves);
    }
    if (p2previousTaggedInChar !== null && battleObj[battleKey][p2name].chars[p2previousTaggedInChar].moves.includes("Boss Orders") 
     && p2resolves[p2previousTaggedInChar] == 0) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Boss Orders", turnResults, turn, p2resolves);
    }

    if (count(turnResults, `**${charName}** used **Humiliate**!`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** used **Humiliate**!`) == 2) {
        //TODO
    }

    if (count(turnResults, `**${charName}** is preparing **Introversion**...`) == 1) {
        //TODO
    } else if (count(turnResults, `**${charName}** is preparing **Introversion**...`) == 2) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Introversion", turnResults, turn, p1resolves);
        emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Introversion", turnResults, turn, p2resolves);        
    }

    if (count(turnResults, `**${charName}** is preparing **Kabedon**...`) == 1) {
        console.log(`Unable to determine which player used Kabedon in turn ${turn} of ${battleKey}`);
    } else if (count(turnResults, `**${charName}** is preparing **Kabedon**...`) == 2) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Kabedon", turnResults, turn, p1resolves);
        emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Kabedon", turnResults, turn, p2resolves);
    }

    if (turnResults.includes(`**<@${p1ID}>** tagged in **${charName}**!`) && p1previousTaggedInChar !== null 
     && battleObj[battleKey][p1name].chars[p1previousTaggedInChar].moves.includes("Lead By Example")) {
        emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Lead By Example", turnResults, turn, p1resolves);
    }
    if (turnResults.includes(`**<@${p2ID}>** tagged in **${charName}**!`) && p2previousTaggedInChar !== null 
     && battleObj[battleKey][p2name].chars[p1previousTaggedInChar].moves.includes("Lead By Example")) {
        emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Lead By Example", turnResults, turn, p2resolves);
    }

    // handle both The Perfect Existence and Kabedon tagging in here
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

    if (battleObj[battleKey][p1name].chars[charName]?.moves.includes("Zenith Pace")) {
        if (count(turnResults, `**${charName}**'s **Initiative** was boosted!`) == 1) {
            //TODO
        } else if (count(turnResults, `**${charName}**'s **Initiative** was boosted!`) == 2) {
            emulateMove(battleObj, battleKey, p1name, p2name, charName, charName, "Zenith Pace", turnResults, turn, p1resolves);
            emulateMove(battleObj, battleKey, p2name, p1name, charName, charName, "Zenith Pace", turnResults, turn, p2resolves); 
        }
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
function determineWhoUsedMove(battleObj, p1name, p2name, charName, battleEmbed, 
                              p1resolves, p2resolves, p1taggedIn, p2taggedIn, affectingMove) {
    let battleKey = p1name + "_vs._" + p2name;
    let turnResults = battleEmbed.fields[2].value;
    let affectingMoveObj = consts.moveInfo[affectingMove];

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

    if (typeof p1resolves[charName] == 'undefined') {
        switch (charName) {
            case 'Perfect Kōenji Rokusuke': p1resolves['Perfect Kōenji Rokusuke'] = 0; break;
            case 'True Kushida Kikyō': p1resolves['True Kushida Kikyō'] = p1resolves['Unmasked Kushida Kikyō']; break;
            case 'Unmasked Kushida Kikyō': p1resolves['Unmasked Kushida Kikyō'] = p1resolves['True Kushida Kikyō']; break;
        }
    }
    let p1resolveDiff = battleObj[battleKey][p1name].chars[charName].resolve - p1resolves[charName];
    if (typeof p2resolves[charName] === 'undefined') {
        switch (charName) {
            case 'Perfect Kōenji Rokusuke': p2resolves['Perfect Kōenji Rokusuke'] = 0; break;
            case 'True Kushida Kikyō': p2resolves['True Kushida Kikyō'] = p2resolves['Unmasked Kushida Kikyō']; break;
            case 'Unmasked Kushida Kikyō': p2resolves['Unmasked Kushida Kikyō'] = p2resolves['True Kushida Kikyō']; break;
        }
    }
    let p2resolveDiff = battleObj[battleKey][p2name].chars[charName].resolve - p2resolves[charName];
    let validMoves = battleObj[battleKey][p1name].chars[charName].moves
        .filter(move => move != affectingMove && !consts.moveInfo[move].type.includes("innate"));

    //if the program made it here, assume that both players made a move,
    //but made different moves. only time this isn't the case is when both players have the same initiative,
    //and one killed the other.
    //note: invulnerable players take 0 damage
    
    if (affectingMoveObj.type.includes("attack")) {
        let affectingMoveStr = `\\*\\*${charName}\\*\\* used \\*\\*${affectingMove}\\*\\*!\\n(\\*\\*CRITICAL HIT!!\\*\\*\\n)?\\*\\*.+\\*\\* took \\*\\*(\\d+)\\*\\* damage!`;
        let affectingMoveRegex = new RegExp(affectingMoveStr);
        let affectingMoveMatch = affectingMoveRegex.exec(turnResults);

        for (let move of validMoves) {
            let moveObj = consts.moveInfo[move];

            if (moveObj.type.includes("prepare")) {
                if (turnResults.includes(`**${charName}** is preparing **${move}**...`)) {
                    //TODO
                }
            } else if (moveObj.type.includes("attack")) {
                if (turnResults.includes(`**${charName}** used **${move}**!`)) {
                    let moveStr = `\\*\\*${charName}\\*\\* used \\*\\*${move}\\*\\*!\\n(\\*\\*CRITICAL HIT!!\\*\\*\\n)?\\*\\*.+\\*\\* took \\*\\*(\\d+)\\*\\* damage!`;
                    let moveRegex = new RegExp(moveStr);
                    let moveMatch = moveRegex.exec(turnResults);

                    if (p1charDead) {

                    } else if (p2charDead) {
                        
                    } else {    //neither dead

                    }
                }
            } else {    //boost, status, misc, with no attack
                if (turnResults.includes(`**${charName}** used **${move}**!`)) {
                    //TODO
                }
            }
        }
    } else {
        for (let move of validMoves) {
            let moveObj = consts.moveInfo[move];

            if (moveObj.type.includes("prepare")) {
                if (turnResults.includes(`**${charName}** is preparing **${move}**...`)) {
                    //TODO
                }
            } else if (moveObj.type.includes("attack")) {   
                if (turnResults.includes(`**${charName}** used **${move}**!`)) {
                    let moveStr = `\\*\\*${charName}\\*\\* used \\*\\*${move}\\*\\*!\\n(\\*\\*CRITICAL HIT!!\\*\\*\\n)?\\*\\*.+\\*\\* took \\*\\*(\\d+)\\*\\* damage!`;
                    let moveRegex = new RegExp(moveStr);
                    let moveMatch = moveRegex.exec(turnResults);
                }
            } else {    //boost, status, misc, with no attack
                if (turnResults.includes(`**${charName}** used **${move}**!`)) {
                    //TODO
                }
            }
        }
    }

    //TODO: remove this
    //this is just here to prevent the script from error'ing while it's still unfinished
    return [p1name, p2name];
}