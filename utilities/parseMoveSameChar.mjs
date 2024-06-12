// determine whether the characters used a move that affects non-resolve stats, 
// where both players used the same character

export function parseMoveSameChar(battleObj, p1name, p2name, charName, turnResults, turn, p1resolves, p2resolves) {
    //consider: what if one person uses a non-damaging move while the other uses a damaging move?
    //what if both use a non-damaging move?
}