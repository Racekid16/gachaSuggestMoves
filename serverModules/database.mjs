import { MongoClient } from 'mongodb';
import fs from 'fs';

let dbConnection;
// 127.0.0.1 if you're running on windows, 
// the output of $ ip route show | grep -i default | awk '{ print $3}' if you're running on WSL
const config = fs.readFileSync('config.json', 'utf-8');
const configJSON = JSON.parse(config);
const ipAddress = configJSON.ipAddress;

export const connectToDb = async (callback) => {
    try {
        let client = await MongoClient.connect(`mongodb://${ipAddress}:27017/BattleData`);
        dbConnection = client.db();
        console.log("Connected to database");
        return callback();
    } catch (error) {
        console.log(error);
        return callback(error);
    }
}

export const getDb = () => dbConnection