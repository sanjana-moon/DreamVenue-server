import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import {
    MongoClient,
    ServerApiVersion,
    ObjectId,
    Collection,
} from 'mongodb';
import { createRemoteJWKSet, jwtVerify, JWTPayload } from 'jose';

dotenv.config();

const app = express();
const port = process.env.PORT;

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials: true,
    })
);
app.use(express.json());

const uri = process.env.MONGO_URI as string;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});

const JWKS = createRemoteJWKSet(
    new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
);

// ============================
// TYPES
// ============================

type ApprovalStatus = "pending" | "approved" | "rejected";
type PublishStatus = "published" | "unpublished";
type BookingStatus = "Pending" | "Confirmed" | "Completed" | "Cancelled";
type UserRole = "customer" | "vendor" | "admin";

interface Venue {
    _id?: ObjectId;
    name: string;
    location: string;
    category: string;
    pricePerEvent: number;
    vendorEmail: string;
    approvalStatus: ApprovalStatus;
    publishStatus: PublishStatus;
    avgRating: number;
    reviewCount: number;
    bookingCount?: number;
    createdAt: Date;
}

interface Booking {
    _id?: ObjectId;
    venueId: string;
    venueName: string;
    customerEmail: string;
    bookingDate: string;
    guestCount: number;
    totalPrice: number;
    transactionId: string;
    paymentStatus: string;
    status: BookingStatus;
    createdAt: Date;
}

interface Review {
    _id?: ObjectId;
    venueId: string;
    venueName: string;
    userEmail: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: Date;
}

interface Payment {
    _id?: ObjectId;
    userEmail: string;
    amount: number;
    transactionId: string;
    paymentStatus: string;
    paymentType: string;
    venueId: string;
    venueName: string;
    paidAt: Date;
}

interface AppUser {
    _id?: ObjectId;
    name: string;
    email: string;
    role: UserRole;
    isBlocked: boolean;
    profileImage?: string;
}

interface AuthenticatedRequest extends Request {
    user?: JWTPayload & { email?: string };
}

// ============================
// AUTH MIDDLEWARE
// ============================

const verifyToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        req.user = payload;
        next();
    } catch (error) {
        console.log(error, "error");
        res.status(403).json({ message: "Forbidden" });
    }
};

async function run() {
    try {
        const db = client.db("dreamvenue");

        const venueCollection: Collection<Venue> = db.collection("venues");
        const bookingCollection: Collection<Booking> = db.collection("bookings");
        const reviewCollection: Collection<Review> = db.collection("reviews");
        const paymentCollection: Collection<Payment> = db.collection("payments");
        const usersCollection: Collection<AppUser> = db.collection("user");

        await bookingCollection.createIndex(
            { venueId: 1, bookingDate: 1 },
            {
                unique: true,
                partialFilterExpression: {
                    status: { $in: ["Pending", "Confirmed"] },
                },
            }
        );

        // ============================
        // VENUES (public listing)
        // ============================


        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Keep connection open while the server is running
    }
}

run().catch(console.dir);

app.get('/', (req: Request, res: Response) => {
    res.send('DreamVenue server is running!');
});

app.listen(port, () => {
    console.log(`DreamVenue app listening on port ${port}`);
});