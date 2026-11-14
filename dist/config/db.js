import { MongoClient, ServerApiVersion } from 'mongodb';
import { config } from './env.js';
const client = new MongoClient(config.mongoUri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
export const db = client.db("dreamvenue");
export const venueCollection = db.collection("venues");
export const bookingCollection = db.collection("bookings");
export const reviewCollection = db.collection("reviews");
export const paymentCollection = db.collection("payments");
export const usersCollection = db.collection("user");
// Initialize indexes
export const initializeDatabase = async () => {
    await bookingCollection.createIndex({ venueId: 1, bookingDate: 1 }, {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["Pending", "Confirmed"] },
        },
    });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
};
