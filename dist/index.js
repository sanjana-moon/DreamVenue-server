import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import { MongoClient, ServerApiVersion, ObjectId, Collection, } from 'mongodb';
import { createRemoteJWKSet, jwtVerify } from "jose";
dotenv.config();
const app = express();
const port = process.env.PORT;
app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
}));
app.use(express.json());
const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    },
});
const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URL}/api/auth/jwks`));
// ============================
// AUTH MIDDLEWARE
// ============================
const verifyToken = async (req, res, next) => {
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
    }
    catch (error) {
        console.log(error, "error");
        res.status(403).json({ message: "Forbidden" });
    }
};
// async function run() {
//     try {
const db = client.db("dreamvenue");
const venueCollection = db.collection("venues");
const bookingCollection = db.collection("bookings");
const reviewCollection = db.collection("reviews");
const paymentCollection = db.collection("payments");
const usersCollection = db.collection("user");
await bookingCollection.createIndex({ venueId: 1, bookingDate: 1 }, {
    unique: true,
    partialFilterExpression: {
        status: { $in: ["Pending", "Confirmed"] },
    },
});
// ============================
// VENUES (public listing)
// ============================
app.get("/api/venues", async (req, res) => {
    try {
        const { search = "", category, minPrice, maxPrice, sort, page = "1", limit = "8", } = req.query;
        const currentPage = Number(page);
        const pageSize = Number(limit);
        const query = {
            approvalStatus: "approved",
            publishStatus: "published",
        };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ];
        }
        if (category && category !== "all") {
            query.category = category;
        }
        if (minPrice || maxPrice) {
            const priceQuery = {};
            if (minPrice)
                priceQuery.$gte = Number(minPrice);
            if (maxPrice)
                priceQuery.$lte = Number(maxPrice);
            query.pricePerEvent = priceQuery;
        }
        let sortOption = {};
        switch (sort) {
            case "name":
                sortOption = { name: 1 };
                break;
            case "price-low":
                sortOption = { pricePerEvent: 1 };
                break;
            case "price-high":
                sortOption = { pricePerEvent: -1 };
                break;
            case "rating":
                sortOption = { avgRating: -1 };
                break;
            case "newest":
                sortOption = { createdAt: -1 };
                break;
        }
        const totalVenues = await venueCollection.countDocuments(query);
        const venues = await venueCollection
            .find(query)
            .sort(sortOption)
            .skip((currentPage - 1) * pageSize)
            .limit(pageSize)
            .toArray();
        res.send({
            venues,
            totalVenues,
            currentPage,
            totalPages: Math.ceil(totalVenues / pageSize),
        });
    }
    catch (error) {
        res.status(500).send({ message: "Failed to fetch venues" });
    }
});
app.get('/api/venues/:id/booked-dates', async (req, res) => {
    try {
        const id = req.params.id;
        if (!id) {
            return res.status(400).send({
                message: "Venue ID is required.",
            });
        }
        const bookings = await bookingCollection
            .find({
            venueId: id,
            status: { $in: ["Pending", "Confirmed"] },
        })
            .toArray();
        const bookedDates = bookings.map((b) => b.bookingDate);
        res.send({ bookedDates });
    }
    catch (err) {
        res.status(500).send({
            message: "Failed to fetch booked dates.",
        });
    }
});
app.get('/api/single-venue/:id', async (req, res) => {
    const { id } = req.params;
    const result = await venueCollection.findOne({ _id: new ObjectId(id) });
    res.send(result);
});
// Specific route before wildcard :id route
app.get('/api/venues/vendor/:email', verifyToken, async (req, res) => {
    const email = req.params.email;
    if (!email) {
        return res.status(400).send({
            message: "Email is required",
        });
    }
    const result = await venueCollection
        .find({ vendorEmail: email })
        .sort({ createdAt: -1 })
        .toArray();
    res.send(result);
});
app.post('/api/venues', verifyToken, async (req, res) => {
    const data = req.body;
    const result = await venueCollection.insertOne({
        ...data,
        approvalStatus: "pending",
        publishStatus: "unpublished",
        avgRating: 0,
        reviewCount: 0,
        createdAt: new Date(),
    });
    res.send(result);
});
app.patch('/api/venues/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const venue = await venueCollection.findOne({ _id: new ObjectId(id) });
    if (!venue) {
        res.status(404).send({ message: "Venue not found" });
        return;
    }
    if (venue.vendorEmail !== req.user?.email) {
        res.status(403).send({ message: "Not authorized to edit this venue" });
        return;
    }
    const result = await venueCollection.updateOne({ _id: new ObjectId(id) }, {
        $set: {
            ...updatedData,
            pricePerEvent: Number(updatedData.pricePerEvent),
        },
    });
    res.send(result);
});
app.delete('/api/venues/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const venue = await venueCollection.findOne({ _id: new ObjectId(id) });
    if (!venue) {
        res.status(404).send({ message: "Venue not found" });
        return;
    }
    if (venue.vendorEmail !== req.user?.email) {
        res.status(403).send({ message: "Not authorized to delete this venue" });
        return;
    }
    const result = await venueCollection.deleteOne({ _id: new ObjectId(id) });
    res.send(result);
});
// ============================
// VENDOR DASHBOARD
// ============================
app.get("/api/vendor-stats/:email", async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) {
            res.status(400).send({ message: "Email is required" });
            return;
        }
        const venues = await venueCollection
            .find({ vendorEmail: email })
            .toArray();
        const totalVenues = venues.length;
        const venueIds = venues.map((v) => v._id.toString());
        const bookings = await bookingCollection
            .find({ venueId: { $in: venueIds } })
            .toArray();
        const pendingRequests = bookings.filter((b) => b.status === "Pending").length;
        const totalEarnings = bookings.reduce((total, b) => total + Number(b.totalPrice || 0), 0);
        const popularVenues = venues
            .sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))
            .slice(0, 5)
            .map((v) => ({
            name: v.name,
            bookings: v.bookingCount || 0,
        }));
        const monthlyEarnings = {};
        bookings.forEach((b) => {
            const date = new Date(b.createdAt);
            const month = date.toLocaleString("default", { month: "short" });
            if (!monthlyEarnings[month]) {
                monthlyEarnings[month] = 0;
            }
            monthlyEarnings[month] += Number(b.totalPrice || 0);
        });
        const earningsChart = Object.entries(monthlyEarnings).map(([month, earnings]) => ({ month, earnings }));
        res.send({
            totalVenues,
            totalEarnings,
            pendingRequests,
            popularVenues,
            earningsChart,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load vendor dashboard stats" });
    }
});
app.get("/api/vendor/bookings/:email", verifyToken, async (req, res) => {
    try {
        const email = req.params.email;
        if (!email) {
            return res.status(400).send({
                message: "Email is required.",
            });
        }
        const venues = await venueCollection
            .find({ vendorEmail: email })
            .toArray();
        const venueIds = venues.map((v) => v._id.toString());
        const bookings = await bookingCollection
            .find({
            venueId: { $in: venueIds },
        })
            .sort({ createdAt: -1 })
            .toArray();
        res.send(bookings);
    }
    catch (err) {
        res.status(500).send({
            message: "Failed to fetch bookings",
        });
    }
});
app.patch("/api/vendor/bookings/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Completed",
            "Cancelled",
        ];
        if (!allowedStatuses.includes(status)) {
            res.status(400).send({ message: "Invalid status" });
            return;
        }
        await bookingCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
        res.send({ success: true, status });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to update booking" });
    }
});
// ============================
// CUSTOMER: BOOKING A VENUE
// ============================
app.post("/api/bookings", async (req, res) => {
    try {
        const { venueId, venueName, bookingDate, guestCount, email, amount, paymentType, transactionId, paymentStatus, } = req.body;
        // Prevent duplicate payment processing
        const existingPayment = await paymentCollection.findOne({
            transactionId,
        });
        if (existingPayment) {
            return res.status(200).send({
                message: "Already processed",
            });
        }
        // Prevent double booking
        const conflict = await bookingCollection.findOne({
            venueId,
            bookingDate: bookingDate,
            status: {
                $in: ["Pending", "Confirmed"],
            },
        });
        if (conflict) {
            return res.status(409).send({
                message: "This venue is already booked for the selected date.",
            });
        }
        const bookingData = {
            venueId,
            venueName,
            customerEmail: email,
            bookingDate: bookingDate,
            guestCount: Number(guestCount),
            totalPrice: Number(amount),
            transactionId,
            paymentStatus,
            status: "Pending",
            createdAt: new Date(),
        };
        let bookingResult;
        try {
            bookingResult =
                await bookingCollection.insertOne(bookingData);
        }
        catch (err) {
            if (err.code === 11000) {
                return res.status(409).send({
                    message: "This venue has just been booked by another customer.",
                });
            }
            throw err;
        }
        await venueCollection.updateOne({
            _id: new ObjectId(venueId),
        }, {
            $inc: {
                bookingCount: 1,
            },
        });
        const paymentData = {
            userEmail: email,
            amount: Number(amount),
            transactionId,
            paymentStatus,
            paymentType,
            venueId,
            venueName,
            paidAt: new Date(),
        };
        await paymentCollection.insertOne(paymentData);
        res.send({
            success: true,
            booking: bookingResult,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Failed to save booking.",
        });
    }
});
app.get("/api/bookings/customer/:email", verifyToken, async (req, res) => {
    const email = req.params.email;
    if (!email) {
        return res.status(400).send({
            message: "Email is required.",
        });
    }
    const result = await bookingCollection
        .find({ customerEmail: email })
        .sort({ createdAt: -1 })
        .toArray();
    res.send(result);
});
// ============================
// CUSTOMER DASHBOARD
// ============================
app.get("/api/customer-stats/:email", async (req, res) => {
    try {
        const { email } = req.params;
        // Type guard to ensure email exists
        if (!email) {
            res.status(400).send({ message: "Email is required" });
            return;
        }
        const bookings = await bookingCollection
            .find({ customerEmail: email })
            .toArray();
        const upcomingBookings = bookings.filter((b) => b.status === "Confirmed" || b.status === "Pending").length;
        const completedEvents = bookings.filter((b) => b.status === "Completed").length;
        const totalSpent = bookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
        const monthlyBookings = {};
        bookings.forEach((b) => {
            const date = new Date(b.createdAt);
            const month = date.toLocaleString("default", { month: "short" });
            if (!monthlyBookings[month]) {
                monthlyBookings[month] = 0;
            }
            monthlyBookings[month] += 1;
        });
        const chartData = Object.entries(monthlyBookings).map(([month, count]) => ({ month, bookings: count }));
        const recentBookings = bookings
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 5);
        res.send({
            upcomingBookings,
            completedEvents,
            totalSpent,
            chartData,
            recentBookings,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({ message: "Failed to load customer dashboard" });
    }
});
app.get("/api/profile", verifyToken, async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) {
            return res.status(401).send({
                message: "Unauthorized",
            });
        }
        const user = await usersCollection.findOne({
            email,
        });
        if (!user) {
            return res.status(404).send({
                message: "User not found",
            });
        }
        res.send({
            name: user.name,
            email: user.email,
            role: user.role,
        });
    }
    catch (error) {
        res.status(500).send({
            message: "Failed to load profile",
        });
    }
});
app.put("/api/profile", verifyToken, async (req, res) => {
    try {
        const email = req.user?.email;
        if (!email) {
            return res.status(401).send({
                message: "Unauthorized",
            });
        }
        const { name, email: newEmail, profileImage } = req.body;
        if (!name || !newEmail) {
            return res.status(400).send({
                message: "Name and email are required",
            });
        }
        // Check if email is being changed and already exists
        if (newEmail !== email) {
            const existingUser = await usersCollection.findOne({
                email: newEmail
            });
            if (existingUser) {
                return res.status(400).send({
                    message: "Email already in use by another account",
                });
            }
        }
        // Update user
        const updateData = {
            name,
            email: newEmail,
        };
        if (profileImage !== undefined) {
            updateData.profileImage = profileImage;
        }
        const result = await usersCollection.updateOne({ email }, { $set: updateData });
        if (result.matchedCount === 0) {
            return res.status(404).send({
                message: "User not found",
            });
        }
        // Fetch updated user
        const updatedUser = await usersCollection.findOne({
            email: newEmail
        });
        res.send({
            name: updatedUser?.name,
            email: updatedUser?.email,
            role: updatedUser?.role,
            profileImage: updatedUser?.profileImage || null,
        });
    }
    catch (error) {
        console.error("Profile update error:", error);
        res.status(500).send({
            message: "Failed to update profile",
        });
    }
});
// ============================
// REVIEWS
// ============================
app.post("/api/reviews", verifyToken, async (req, res) => {
    try {
        const { venueId, venueName, userEmail, userName, rating, comment, } = req.body;
        const booking = await bookingCollection.findOne({
            customerEmail: userEmail,
            venueId,
            status: "Completed",
        });
        if (!booking) {
            res.status(403).send({
                message: "Only customers with a completed booking can review this venue.",
            });
            return;
        }
        const existing = await reviewCollection.findOne({ userEmail, venueId });
        if (existing) {
            res.status(400).send({ message: "You already reviewed this venue." });
            return;
        }
        const result = await reviewCollection.insertOne({
            venueId,
            venueName,
            userEmail,
            userName,
            rating,
            comment,
            createdAt: new Date(),
        });
        const allReviews = await reviewCollection.find({ venueId }).toArray();
        const avgRating = allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) /
            allReviews.length;
        await venueCollection.updateOne({ _id: new ObjectId(venueId) }, { $set: { avgRating, reviewCount: allReviews.length } });
        res.send(result);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to add review." });
    }
});
app.get("/api/venues/:venueId/reviews", async (req, res) => {
    try {
        const { venueId } = req.params;
        // Type guard to ensure venueId exists
        if (!venueId) {
            res.status(400).send({ message: "Venue ID is required" });
            return;
        }
        const reviews = await reviewCollection
            .find({ venueId: venueId })
            .sort({ createdAt: -1 })
            .toArray();
        res.send(reviews);
    }
    catch (err) {
        console.error("Error fetching reviews:", err);
        res.status(500).send({ message: "Failed to fetch reviews." });
    }
});
app.get("/api/venues/:venueId/can-review/:email", async (req, res) => {
    try {
        const venueId = req.params.venueId;
        const email = req.params.email;
        if (!venueId || !email) {
            return res.status(400).send({
                message: "Venue ID and email are required.",
            });
        }
        const completed = await bookingCollection.findOne({
            customerEmail: email,
            venueId,
            status: "Completed",
        });
        const alreadyReviewed = await reviewCollection.findOne({
            userEmail: email,
            venueId,
        });
        res.send({
            canReview: !!completed && !alreadyReviewed,
        });
    }
    catch (err) {
        res.status(500).send({
            message: "Failed",
        });
    }
});
app.get("/api/user/reviews/:email", async (req, res) => {
    try {
        const { email } = req.params;
        if (!email) {
            res.status(400).send({ message: "Email is required" });
            return;
        }
        const reviews = await reviewCollection
            .find({ userEmail: email })
            .sort({ createdAt: -1 })
            .toArray();
        res.send(reviews);
    }
    catch (err) {
        console.error("Error fetching user reviews:", err);
        res.status(500).send({ message: "Failed to load reviews." });
    }
});
app.patch("/api/reviews/:id", verifyToken, async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const result = await reviewCollection.updateOne({ _id: new ObjectId(id) }, { $set: { rating, comment } });
    res.send(result);
});
app.delete("/api/reviews/:id", verifyToken, async (req, res) => {
    const result = await reviewCollection.deleteOne({
        _id: new ObjectId(req.params.id),
    });
    res.send(result);
});
// ============================
// ADMIN
// ============================
app.get("/api/admin/pending-venues", async (req, res) => {
    try {
        const venues = await venueCollection
            .find({ approvalStatus: "pending" })
            .sort({ createdAt: -1 })
            .toArray();
        res.send(venues);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to fetch pending venues." });
    }
});
app.get('/api/admin/venues', async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status && status !== "all") {
            query.approvalStatus = status;
        }
        const result = await venueCollection
            .find(query)
            .sort({ createdAt: -1 })
            .toArray();
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to fetch venues" });
    }
});
app.patch('/api/admin/venues/:id', verifyToken, async (req, res) => {
    const id = req.params.id;
    const { approvalStatus } = req.body;
    if (!approvalStatus) {
        res.status(400).send({ message: "approvalStatus is required" });
        return;
    }
    const result = await venueCollection.updateOne({ _id: new ObjectId(id) }, { $set: { approvalStatus } });
    res.send(result);
});
app.patch("/api/admin/venues/:id/publish", async (req, res) => {
    try {
        const { id } = req.params;
        const { publishStatus } = req.body;
        if (!publishStatus) {
            res.status(400).send({ message: "publishStatus is required" });
            return;
        }
        await venueCollection.updateOne({ _id: new ObjectId(id) }, { $set: { publishStatus } });
        res.send({ success: true, publishStatus });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to update publish status." });
    }
});
app.get("/api/admin/users", async (req, res) => {
    try {
        const users = await usersCollection
            .find({ role: { $ne: "admin" } })
            .sort({ name: 1 })
            .toArray();
        res.send(users);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to fetch users" });
    }
});
app.patch("/api/admin/users/:id/role", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const allowedRoles = ["customer", "vendor", "admin"];
        if (!allowedRoles.includes(role)) {
            res.status(400).send({ message: "Invalid role" });
            return;
        }
        await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { role } });
        res.send({ success: true });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to update role" });
    }
});
app.patch("/api/admin/users/:id/block", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;
        await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { isBlocked: !!isBlocked } });
        res.send({ success: true, isBlocked: !!isBlocked });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to update block status" });
    }
});
app.delete("/api/admin/users/:id", verifyToken, async (req, res) => {
    try {
        const { id } = req.params;
        await usersCollection.deleteOne({ _id: new ObjectId(id) });
        res.send({ success: true });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to delete user" });
    }
});
app.get("/api/admin/transactions", async (req, res) => {
    try {
        const payments = await paymentCollection
            .find()
            .sort({ paidAt: -1 })
            .toArray();
        const transactions = await Promise.all(payments.map(async (payment) => {
            const venue = await venueCollection.findOne({
                _id: new ObjectId(payment.venueId),
            });
            return {
                _id: payment._id,
                transactionId: payment.transactionId,
                userEmail: payment.userEmail,
                vendorEmail: venue?.vendorEmail || "N/A",
                amount: payment.amount,
                paidAt: payment.paidAt,
            };
        }));
        res.send(transactions);
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to fetch transactions" });
    }
});
app.get("/api/admin/dashboard", async (req, res) => {
    try {
        const totalUsers = await usersCollection.countDocuments({
            role: { $ne: "admin" },
        });
        const totalVenues = await venueCollection.countDocuments();
        const totalBookings = await bookingCollection.countDocuments();
        const payments = await paymentCollection.find().toArray();
        const totalRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const categoryStats = await venueCollection
            .aggregate([
            { $group: { _id: "$category", value: { $sum: 1 } } },
        ])
            .toArray();
        const venuesByCategory = categoryStats.map((item) => ({
            category: item._id,
            value: item.value,
        }));
        res.send({
            totalUsers,
            totalVenues,
            totalBookings,
            totalRevenue,
            venuesByCategory,
        });
    }
    catch (err) {
        console.error(err);
        res.status(500).send({ message: "Failed to load dashboard" });
    }
});
app.get("/api/admin/bookings", verifyToken, async (req, res) => {
    try {
        const bookings = await bookingCollection
            .find()
            .sort({ createdAt: -1 })
            .toArray();
        res.send(bookings);
    }
    catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Failed to fetch bookings",
        });
    }
});
app.patch("/api/admin/bookings/:id", verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const allowedStatuses = [
            "Pending",
            "Confirmed",
            "Completed",
            "Cancelled",
        ];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).send({
                message: "Invalid booking status",
            });
        }
        await bookingCollection.updateOne({
            _id: new ObjectId(id),
        }, {
            $set: {
                status,
            },
        });
        res.send({
            success: true,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Failed to update booking",
        });
    }
});
app.delete("/api/admin/bookings/:id", verifyToken, async (req, res) => {
    try {
        const id = req.params.id;
        await bookingCollection.deleteOne({
            _id: new ObjectId(id),
        });
        res.send({
            success: true,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).send({
            message: "Failed to delete booking",
        });
    }
});
app.get('/api/venues/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await venueCollection.findOne({
            _id: new ObjectId(id)
        });
        if (!result) {
            res.status(404).send({ message: "Venue not found" });
            return;
        }
        res.send(result);
    }
    catch (error) {
        console.error("Error fetching venue:", error);
        res.status(500).send({ message: "Failed to fetch venue" });
    }
});
console.log("Pinged your deployment. You successfully connected to MongoDB!");
//     } finally {
//         // Keep connection open while the server is running
//     }
// }
// run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('DreamVenue server is running!');
});
app.listen(port, () => {
    console.log(`DreamVenue app listening on port ${port}`);
});
//# sourceMappingURL=index.js.map