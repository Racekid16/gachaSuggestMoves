//code dealing with characters that can transform
import { splitCharName } from "./aspect.mjs";
import { addBoost } from "./updateBoosts.mjs";
import consts from '../consts.json' assert { type: 'json' };

// charName is the current tagged-in char after the turn that was just parsed
// and the one you'll transform into, if applicable
export function applyTransformation(battleObj, battleKey, playerName, charName, turn) {
    if (charName !== null && typeof battleObj[battleKey][playerName].chars[charName] === 'undefined') {
        let [aspect, charNameNoAspect] = splitCharName(charName);

        if (consts.transformChars.includes(charNameNoAspect)) {
            let previousCharName;
            switch (charNameNoAspect) {

                case "Freed Horikita Suzune":
                    previousCharName = aspect + "Detained Horikita Suzune";
                    battleObj[battleKey][playerName].chars[charName] = structuredClone(battleObj[battleKey][playerName].chars[previousCharName]);
                    battleObj[battleKey][playerName].baseCharStats[charName] = structuredClone(battleObj[battleKey][playerName].baseCharStats[previousCharName]);
                    let attackCharObj = battleObj[battleKey][playerName].chars[charName];
                    let attackCharBaseObj = battleObj[battleKey][playerName].baseCharStats[charName];
                    attackCharObj.moves[attackCharObj.moves.indexOf("Bottle Break")] = "Influence";
                    attackCharBaseObj.moves[attackCharBaseObj.moves.indexOf("Bottle Break")] = "Influence";
                    attackCharObj.personality = "Reserved";
                    attackCharBaseObj.personality = "Reserved";
                    delete battleObj[battleKey][playerName].chars[previousCharName];
                    delete battleObj[battleKey][playerName].baseCharStats[previousCharName];
                    break;

                case "Serious Kōenji Rokusuke":
                    previousCharName = aspect + "Perfect Kōenji Rokusuke";
                    battleObj[battleKey][playerName].chars[charName] = structuredClone(battleObj[battleKey][playerName].chars[previousCharName]);
                    battleObj[battleKey][playerName].baseCharStats[charName] = structuredClone(battleObj[battleKey][playerName].baseCharStats[previousCharName]);
                    battleObj[battleKey][playerName].chars[charName].moves.splice(
                        battleObj[battleKey][playerName].chars[charName].moves.indexOf("The Perfect Existence")
                    , 1);
                    battleObj[battleKey][playerName].baseCharStats[charName].moves.splice(
                        battleObj[battleKey][playerName].baseCharStats[charName].moves.indexOf("The Perfect Existence")
                    , 1);
                    delete battleObj[battleKey][playerName].chars[previousCharName];
                    delete battleObj[battleKey][playerName].baseCharStats[previousCharName];
                    addBoost(battleObj, battleKey, playerName, charName, "The Perfect Existence", turn);
                    break;

                case "True Kushida Kikyō":
                    previousCharName = aspect + "Unmasked Kushida Kikyō";
                    battleObj[battleKey][playerName].chars[charName] = structuredClone(battleObj[battleKey][playerName].chars[previousCharName]);
                    battleObj[battleKey][playerName].baseCharStats[charName] = structuredClone(battleObj[battleKey][playerName].baseCharStats[previousCharName]);
                    battleObj[battleKey][playerName].chars[charName].moves = ["Academic", "Empathy", "Charm", "Unmask"];
                    battleObj[battleKey][playerName].baseCharStats[charName].moves = ["Academic", "Empathy", "Charm", "Unmask"];
                    battleObj[battleKey][playerName].chars[charName].personality = "Benevolent";
                    battleObj[battleKey][playerName].baseCharStats[charName].personality = "Benevolent";
                    delete battleObj[battleKey][playerName].chars[previousCharName];
                    delete battleObj[battleKey][playerName].baseCharStats[previousCharName];
                    break;

                case "Unmasked Kushida Kikyō":
                    previousCharName = aspect + "True Kushida Kikyō";
                    battleObj[battleKey][playerName].chars[charName] = structuredClone(battleObj[battleKey][playerName].chars[previousCharName]);
                    battleObj[battleKey][playerName].baseCharStats[charName] = structuredClone(battleObj[battleKey][playerName].baseCharStats[previousCharName]);
                    battleObj[battleKey][playerName].chars[charName].moves = ["Scheming", "Fighting", "Shatter", "Mask"];
                    battleObj[battleKey][playerName].baseCharStats[charName].moves = ["Scheming", "Fighting", "Shatter", "Mask"];
                    battleObj[battleKey][playerName].chars[charName].personality = "Cold";
                    battleObj[battleKey][playerName].baseCharStats[charName].personality = "Cold";
                    delete battleObj[battleKey][playerName].chars[previousCharName];
                    delete battleObj[battleKey][playerName].baseCharStats[previousCharName];
                    break;
            }
        
        } else {
            console.log(`Unrecognized transform character ${charName} in turn ${turn} of ${battleKey}`);
        }
    }
}

export function setTransformationResolve(charName, playerResolves) {
    let [aspect, charNameNoAspect] = splitCharName(charName);
    switch (charNameNoAspect) {
        case 'Perfect Kōenji Rokusuke': 
            playerResolves[aspect + 'Perfect Kōenji Rokusuke'] = 0;
            break;
        case 'True Kushida Kikyō':
            playerResolves[aspect + 'True Kushida Kikyō'] = playerResolves[aspect + 'Unmasked Kushida Kikyō'];
            break;
        case 'Unmasked Kushida Kikyō':
            playerResolves[aspect + 'Unmasked Kushida Kikyō'] = playerResolves[aspect + 'True Kushida Kikyō'];
            break;
    }
}