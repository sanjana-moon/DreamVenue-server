import { MongoClient, ServerApiVersion, Collection } from 'mongodb';
import { config } from './env.js';
import { Venue, Booking, Review, Payment, AppUser } from '../types/index.js';

const client = new MongoClient(config.mongoUri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

export const db = client.db("dreamvenue");

export const venueCollection: Collection<Venue> = db.collection("venues");
export const bookingCollection: Collection<Booking> = db.collection("bookings");
export const reviewCollection: Collection<Review> = db.collection("reviews");
export const paymentCollection: Collection<Payment> = db.collection("payments");
export const usersCollection: Collection<AppUser> = db.collection("user");

// Initialize indexes
export const initializeDatabase = async () => {
    await bookingCollection.createIndex(
        { venueId: 1, bookingDate: 1 },
        {
            unique: true,
            partialFilterExpression: {
                status: { $in: ["Pending", "Confirmed"] },
            },
        }
    );
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
};