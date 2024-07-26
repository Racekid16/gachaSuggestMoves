//functions for dealing with runes
import { addBoost } from "./updateBoosts.mjs";
import { addInflictModifier, addReceiveModifier } from "./updateDamageModifiers.mjs";
import { round } from "./round.mjs";
import e from "cors";

//see if the turn results indicate that this character has a rune. 
export function detectRune(battleObj, battleKey, playerName, charName, turnResults) {
    //Affinity skip
    //Ataraxy
    //Convalescence
    if (turnResults.includes(`**${charName}**'s **Rune of Convalescence** glowed dimly...`)) {
        addRune(battleObj, battleKey, playerName, charName, "Convalescence");
    }
    //Focus
    //Glass
    //Glory
    if (turnResults.includes(`**${charName}**'s **Rune of Glory** began to glow brighter!`)) {
        addRune(battleObj, battleKey, playerName, charName, "Glory");
    }
    //Instinct
    //Obliteration skip
    if (turnResults.includes(`**${charName}** used **Obliterate**!`)) {
        addRune(battleObj, battleKey, playerName, charName, "Obliteration");
    }
    //Obstinance skip
    if (turnResults.includes(`**${charName}**'s **Rune of Obstinance** activated with a brilliant golden light!`)) {
        addRune(battleObj, battleKey, playerName, charName, "Obstinance");
    }
    //Purity
    if (turnResults.includes(`**${charName}**'s **Rune of Purity** activated with a brilliant golden light!`)) {
       addRune(battleObj, battleKey, playerName, charName, "Purity"); 
    }
    //Rage
    if (turnResults.includes(`**${charName}**'s **Rune of Rage** activated with a brilliant golden light!`)) {
        addRune(battleObj, battleKey, playerName, charName, "Rage");
    }
    //Retaliation
    if (turnResults.includes(`**${charName}**'s **Rune of Retaliation** emitted a harmful pulse!`)) {
        addRune(battleObj, battleKey, playerName, charName, "Retaliation");
    }
    //Spite
    if (turnResults.includes(`**${charName}**'s **Rune of Spite** activated with a brilliant golden light!`)) {
        addRune(battleObj, battleKey, playerName, charName, "Spite");
    }
    //Summoning
    if (turnResults.includes(`**${charName}**'s **Rune of Summoning** activated with a brilliant golden light!`)) {
        addRune(battleObj, battleKey, playerName, charName, "Summoning");
    }
    //Wrath
}

export function addRune(battleObj, battleKey, playerName, charName, rune) {
    if (battleObj[battleKey][playerName].chars[charName].rune == rune) {
        return;
    }
    removeRune(battleObj, battleKey, playerName, charName);
    battleObj[battleKey][playerName].chars[charName].rune = rune;
    battleObj[battleKey].log(`Rune of ${rune} added to ${playerName}'s ${charName}`);

    switch (rune) {
        case 'Affinity':
            battleObj[battleKey][playerName].chars[charName].resolve = round(battleObj[battleKey][playerName].chars[charName].resolve * 1.1);
            addBoost(battleObj, battleKey, playerName, charName, 'Affinity', 1, false);
            break;
        //Ataraxy deal in
        //Convalescence deal in
        case 'Focus':
            addInflictModifier(battleObj, battleKey, playerName, charName, 0.5, 1, Infinity, false); 
            break;
        //Glass deal in
        case 'Glory':   //deal in
            addBoost(battleObj, battleKey, playerName, charName, 'Glory Initial', 1, false);
            break;
        case 'Instinct':
            addBoost(battleObj, battleKey, playerName, charName, 'Instinct', 1, false);
            break;
        case 'Obliteration':
            battleObj[battleKey][playerName].chars[charName].moves.push('Obliterate');
            break;
        //Obstinance skip
        //Purity deal later
        case 'Rage':
            addInflictModifier(battleObj, battleKey, playerName, charName, 0.5, 1, Infinity, false); 
            break;
        //Retaliation skip
        //Spite deal later
        case 'Summoning':   //deal in
            if (typeof battleObj[battleKey][playerName].chars.Pawn !== 'undefined') {
                battleObj[battleKey][playerName].chars.Pawn.mental = round(battleObj[battleKey][playerName].chars.Pawn.mental * 1.5);
                battleObj[battleKey][playerName].chars.Pawn.physical = round(battleObj[battleKey][playerName].chars.Pawn.physical * 1.5);
                battleObj[battleKey][playerName].chars.Pawn.social = round(battleObj[battleKey][playerName].chars.Pawn.social * 1.5);
            }
        case 'Wrath':
            addReceiveModifier(battleObj, battleKey, playerName, charName, 0.33, 1, Infinity, false);
            break;
    }
}

//for runes that should be applied once after the moves have been parsed
export function applyRunesAfter(battleObj, battleKey, p1name, p2name, p1char, p2char, turnResults) {
    //Purity
    if (turnResults.includes(`The dim glow of **${p1char}**'s **Rune of Purity** faded, leaving behind a dormant tattoo.`)) {
        battleObj[battleKey][p1name].chars[p1char].debuffs.shift();
    }
    if (turnResults.includes(`The dim glow of **${p2char}**'s **Rune of Purity** faded, leaving behind a dormant tattoo.`)) {
        battleObj[battleKey][p2name].chars[p2char].debuffs.shift();
    }
    //Spite
    if (turnResults.includes(`The dim glow of **${p1char}**'s **Rune of Spite** faded, leaving behind a dormant tattoo.`)) {
        removeRune(battleObj, battleKey, p2name, p2char);
    }
    if (turnResults.includes(`The dim glow of **${p2char}**'s **Rune of Spite** faded, leaving behind a dormant tattoo.`)) {
        removeRune(battleObj, battleKey, p1name, p1char);
    }
}

//does the inverse of addRune
function removeRune(battleObj, battleKey, playerName, charName) {
    let rune = battleObj[battleKey][playerName].chars[charName].rune;
    if (battleObj[battleKey][playerName].chars[charName].rune == "None") {
        return;
    }
    battleObj[battleKey][playerName].chars[charName].rune = "None";

    switch (rune) {
        case 'Affinity':
            battleObj[battleKey][playerName].chars[charName].resolve = round(battleObj[battleKey][playerName].chars[charName].resolve / 1.1);
            battleObj[battleKey][playerName].chars[charName].buffs = battleObj[battleKey][playerName].chars[charName].buffs.filter(obj => {
                return obj.name != 'Affinity';
            });
            break;
        //Ataraxy deal in
        //Convalescence deal in
        case 'Focus':
            let focusIndex = battleObj[battleKey][playerName].chars[charName].inflictModifiers.findIndex(el => {
                return el.amount = 0.5 && el.endTurn == Infinity && el.canBeNullified == false
            });
            if (focusIndex != -1) {
                battleObj[battleKey][playerName].chars[charName].inflictModifiers.splice(focusIndex, 1);
            }
            break;
        //Glass deal in
        case 'Glory':   //deal in
            battleObj[battleKey][playerName].chars[charName].buffs = battleObj[battleKey][playerName].chars[charName].buffs.filter(obj => {
                return obj.name != 'Glory Initial' && obj.name != 'Glory Defeat';
            });
            break;
        case 'Instinct':
            battleObj[battleKey][playerName].chars[charName].buffs = battleObj[battleKey][playerName].chars[charName].buffs.filter(obj => {
                return obj.name != 'Instinct';
            });
            break;
        case 'Obliteration':
            battleObj[battleKey][playerName].chars[charName].moves = battleObj[battleKey][playerName].chars[charName].moves.filter(move => {
                return move != "Obliterate";
            });
            break;
        //Obstinance skip
        //Purity deal later
        case 'Rage':
            let rageIndex = battleObj[battleKey][playerName].chars[charName].inflictModifiers.findIndex(el => {
                return el.amount = 0.5 && el.endTurn == Infinity && el.canBeNullified == false
            });
            if (rageIndex != -1) {
                battleObj[battleKey][playerName].chars[charName].inflictModifiers.splice(rageIndex, 1);
            }
            break;
        //Retaliation skip
        //Spite deal later
        case 'Summoning':   //deal in
            if (typeof battleObj[battleKey][playerName].chars.Pawn !== 'undefined') {
                battleObj[battleKey][playerName].chars.Pawn.mental = round(battleObj[battleKey][playerName].chars.Pawn.mental / 1.5);
                battleObj[battleKey][playerName].chars.Pawn.physical = round(battleObj[battleKey][playerName].chars.Pawn.physical / 1.5);
                battleObj[battleKey][playerName].chars.Pawn.social = round(battleObj[battleKey][playerName].chars.Pawn.social / 1.5);
            }
        case 'Wrath':
            let wrathIndex = battleObj[battleKey][playerName].chars[charName].receiveModifiers.findIndex(el => {
                return el.amount = 0.33 && el.endTurn == Infinity && el.canBeNullified == false
            });
            if (wrathIndex != -1) {
                battleObj[battleKey][playerName].chars[charName].receiveModifiers.splice(wrathIndex, 1);
            }
            break;
    }
}