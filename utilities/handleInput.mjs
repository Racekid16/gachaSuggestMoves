import readline from 'readline';

let rl = null;
let inputPromises = {};
let userInputQueue = [];
let currentPrompt = null;

export function getUserInput(battleKey, p1name, p2name, affectingMove) {
    if (inputPromises[battleKey]) {
        cancelInput(battleKey);
    }

    const promptMessage = `Did 1.${p1name} or 2.${p2name} use ${affectingMove}?\n`;
    const userInputPromise = new Promise((resolve, reject) => {
        userInputQueue.push({
            key: battleKey,
            message: promptMessage,
            resolve,
            reject,
            cancelled: false
        });
        if (!currentPrompt) {
            processNextPrompt();
        }
    }).then((response) => {
        if (userInputPromise.cancelled) {
            throw new Error('Input cancelled by function.');
        }
        return response;
    });

    userInputPromise.cancel = () => {
        userInputPromise.cancelled = true;
        closeReadlineInterface();
    };

    inputPromises[battleKey] = userInputPromise;

    return userInputPromise.finally(() => {
        delete inputPromises[battleKey];
    });
}

export function cancelInput(battleKey) {
    const index = userInputQueue.findIndex(prompt => prompt.key === battleKey);
    if (index !== -1) {
        userInputQueue[index].cancelled = true;
        console.log(`User did not specify who used which move in ${battleKey}.`);
        userInputQueue[index].reject(new Error('Input cancelled by function.'));
        userInputQueue.splice(index, 1);
    } else if (currentPrompt && currentPrompt.key === battleKey) {
        currentPrompt.cancelled = true;
        closeReadlineInterface();
        processNextPrompt();
    }
}

function createReadlineInterface() {
    if (!rl) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        rl.on('close', () => {
            rl = null;
        });
    }
}

function closeReadlineInterface() {
    if (rl) {
        rl.close();
        rl = null;
    }
}

function processNextPrompt() {
    if (userInputQueue.length > 0) {
        currentPrompt = userInputQueue.shift();
        createReadlineInterface();
        rl.question(currentPrompt.message, (response) => {
            if (currentPrompt.cancelled) {
                currentPrompt.reject(new Error('Input cancelled by function.'));
            } else {
                currentPrompt.resolve(response);
            }
            processNextPrompt();
        });
    } else {
        currentPrompt = null;
        closeReadlineInterface();
    }
}