import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error("No MONGO_URI found in env");
    process.exit(1);
}

const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        const db = client.db("dreamvenue");
        const venues = await db.collection("venues").find({}).toArray();
        for (const v of venues) {
            console.log(`${v.name} (ID: ${v._id}):`);
            console.log("  Keys:", Object.keys(v));
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run();
