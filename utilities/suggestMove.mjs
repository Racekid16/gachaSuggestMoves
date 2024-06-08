// given stats for characters, suggest moves for both players

export function suggestMove(battleObj, battleKey, attacker, defender) {
    // only suggest moves if both players have a character selected
    if (battleObj[battleKey][attacker].currentChar == null ||
        battleObj[battleKey][defender].currentChar == null) {
        return;
    }
}