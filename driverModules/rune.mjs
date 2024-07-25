//functions for dealing with runes
import { addBoost } from "./updateBoosts.mjs";
import { addInflictModifier, addReceiveModifier } from "./updateDamageModifiers.mjs";
import { round } from "./round.mjs";

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
    battleObj[battleKey][playerName].chars[charName].rune = rune;
    battleObj[battleKey].log(`Rune of ${rune} added to ${playerName}'s ${charName}`);

    switch (rune) {
        case 'Affinity':
            battleObj[battleKey][playerName].chars[charName].resolve = round(battleObj[battleKey][playerName].chars[charName].resolve * 1.1);
            battleObj[battleKey][playerName].chars[charName].mental = round(battleObj[battleKey][playerName].chars[charName].mental * 1.1);
            battleObj[battleKey][playerName].chars[charName].physical = round(battleObj[battleKey][playerName].chars[charName].physical * 1.1);
            battleObj[battleKey][playerName].chars[charName].social = round(battleObj[battleKey][playerName].chars[charName].social * 1.1);
            break;
        //Ataraxy deal in
        //Convalescence deal in
        case 'Focus':
            addInflictModifier(battleObj, battleKey, playerName, charName, 0.5, 1, Infinity); 
            break;
        //Glass deal in
        case 'Glory':   //deal in
            addBoost(battleObj, battleKey, playerName, charName, 'Glory Initial', 1);
            break;
        case 'Instinct':
            addBoost(battleObj, battleKey, playerName, charName, 'Instinct', 1);
            break;
        case 'Obliteration':
            battleObj[battleKey][playerName].chars[charName].moves.push('Obliterate');
            break;
        //Obstinance skip
        //Purity deal later
        case 'Rage':
            addInflictModifier(battleObj, battleKey, playerName, charName, 0.5, 1, Infinity); 
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
            addReceiveModifier(battleObj, battleKey, playerName, charName, 0.33, 1, Infinity);
            break;
    }
}

//for runes that should be applied once after the moves have been parsed
export function applyRunesAfter(battleObj, battleKey, p1name, p2name, p1char, p2char, turnResults) {
    //Purity
    if (turnResults.includes(`The dim glow of **${p1char}**'s **Rune of Purity** faded, leaving behind a dormant tattoo.`)) {
        battleObj[battleKey][p1name].chars[p1char].debuffs = [];
    }
    if (turnResults.includes(`The dim glow of **${p2char}**'s **Rune of Purity** faded, leaving behind a dormant tattoo.`)) {
        battleObj[battleKey][p2name].chars[p2char].debuffs = [];
    }
    //Spite
    if (turnResults.includes(`The dim glow of **${p1char}**'s **Rune of Spite** faded, leaving behind a dormant tattoo.`)) {
        battleObj[battleKey][p2name].chars[p2char].rune = "None";
    }
    if (turnResults.includes(`The dim glow of **${p2char}**'s **Rune of Spite** faded, leaving behind a dormant tattoo.`)) {
        battleObj[battleKey][p1name].chars[p1char].rune = "None";
    }
}