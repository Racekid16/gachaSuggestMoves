// Make a round function that matches the behavior of Python's round() function
// Because JavaScript's Math.round() slightly differs.

export function round(number) {
    let roundedNumber = Math.round(number);
    if (roundedNumber % 2 !== 0) {
        if (Math.abs(number - roundedNumber) === 0.5) {
            return Math.round(number / 2) * 2;
        }
    }
    return roundedNumber;
}