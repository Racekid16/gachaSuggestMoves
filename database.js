const { MongoClient } = require('mongodb');
const fs = require('fs');

let dbConnection;
// 127.0.0.1 if you're running on windows, 
// the output of $ ip route show | grep -i default | awk '{ print $3}' if you're running on WSL
const ipAddress = fs.readFileSync('./ipAddress.txt', 'utf8');

module.exports = {
    connectToDb: async (callback) => {
        try {
            let client = await MongoClient.connect(`mongodb://${ipAddress}:27017/BattleData`);
            dbConnection = client.db();
            console.log("Connected to database");
            return callback();
        } catch (error) {
            console.log(error);
            return callback(error);
        }
    },

    getDb: () => dbConnection
}