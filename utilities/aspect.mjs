//functions dealing with aspect innate moves.
import { round } from "./round.mjs";

//change the character's name to reflect their aspect and add the aspect move to their moveset
//char is an object of the character's name, number of stars, and aspects
//charObj is an object containing more information about the character such as their initial stats and moves
export function addAspectAttributes(char, charObj) {
    char.name = char.aspect + char.name;
    charObj.aspect = char.aspect;
    charObj.name = char.name;
    switch (char.aspect) {
        case "Infernal ":
            charObj.moves.push("Aspect Of Fire");
            break;
        case "Titanium ":
            charObj.moves.push("Aspect Of Metal");
            break;
        case "Tidal ":
            charObj.moves.push("Aspect Of Water");
            break;
        default:
            break;
    }
}

//increase the character's aspect multiplier based on the aspect move they have.
//I do not consider these normal boosts; they cannot be nullified or stolen.
export function applyAspectBoost(charObj) {
    charObj.aspectBoost = {
        initiative: 0,
        mental: 0,
        physical: 0,
        social: 0,
        resolve: 0
    };
    if (charObj.moves.includes("Aspect Of Fire")) {
        charObj.resolve = round(charObj.resolve * 1.5);
        charObj.aspectBoost.mental = 0.75;
        charObj.aspectBoost.physical = 0.75;
        charObj.aspectBoost.social = 0.75;
    }
    if (charObj.moves.includes("Aspect Of Metal")) {
        charObj.resolve = round(charObj.resolve * 2);
        charObj.aspectBoost.mental = 0.5;
        charObj.aspectBoost.physical = 0.5;
        charObj.aspectBoost.social = 0.5;
    }
    if (charObj.moves.includes("Aspect Of Water")) {
        charObj.resolve = round(charObj.resolve * 1.5);
        charObj.aspectBoost.mental = 0.5;
        charObj.aspectBoost.physical = 0.5;
        charObj.aspectBoost.social = 0.5;
    }
}

//split a character's name into its aspect and base name
export function splitCharName(charName) {
    for (let aspect of ['Infernal ', 'Titanium ', 'Tidal ']) {
        if (charName.startsWith(aspect)) {
            return [aspect, returnVal.slice(aspect.length)];
        }
    }
    return ["", charName];
}