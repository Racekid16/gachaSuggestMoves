// given stats for characters, suggest moves for both players

let baseMovesAttackStat = {
    'Academic': 'mental',
    'Scheming': 'mental',
    'Fighting': 'physical',
    'Athleticism': 'physical',
    'Influence': 'social',
    'Empathy': 'social'
};

let personalityWeaknesses = {
    "Apathethic": [],
    "Cold": ["Scheming", "Empathy"],
    "Bold": ["Academic", "Fighting"],
    "Savant": ["Athleticism", "Influence"],
    "Cunning": ["Influence", "Empathy"],
    "Benevolent": ["Scheming", "Fighting"],
    "Timid": ["Athleticism", "Empathy"],
    "Explosive": ["Academic", "Scheming"],
    "Reserved": ["Athleticism", "Fighting"],
    "Selfish": ["Academic", "Influence"]
};

export function suggestMove(battleObj, battleKey, attacker, defender) {
    // only suggest moves if both players have a character selected
    let attackChar = battleObj[battleKey][attacker].currentChar;
    let defenseChar = battleObj[battleKey][defender].currentChar;
    if (attackChar == null || defenseChar == null) {
        return;
    }

    let predictedDamage = -1;
    let maxPredictedDamage = -1;

    for (let move of battleObj[battleKey][attacker].chars[attackChar].moves) {
        if (Object.keys(baseMovesAttackStat).includes(move)) {

        } else {
            switch (move) {
                case '':
                    break;
            }
        }
    }

    // TODO: remove this
    //console.log(battleObj[battleKey][attacker].chars);
}