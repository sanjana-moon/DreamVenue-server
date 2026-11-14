import { ObjectId } from "mongodb";
import { venueCollection, bookingCollection, reviewCollection } from "../config/db.js";
export const createReview = async (req, res) => {
    try {
        const { venueId, venueName, userEmail, userName, rating, comment } = req.body;
        const booking = await bookingCollection.findOne({ customerEmail: userEmail, venueId, status: "Completed" });
        if (!booking)
            return res.status(403).send({ message: "Only customers with a completed booking can review this venue." });
        const existing = await reviewCollection.findOne({ userEmail, venueId });
        if (existing)
            return res.status(400).send({ message: "You already reviewed this venue." });
        const result = await reviewCollection.insertOne({
            venueId, venueName, userEmail, userName, rating, comment, createdAt: new Date(),
        });
        const allReviews = await reviewCollection.find({ venueId }).toArray();
        const avgRating = allReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / allReviews.length;
        await venueCollection.updateOne({ _id: new ObjectId(venueId) }, { $set: { avgRating, reviewCount: allReviews.length } });
        res.send(result);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to add review." });
    }
};
export const getVenueReviews = async (req, res) => {
    try {
        const { venueId } = req.params;
        if (!venueId)
            return res.status(400).send({ message: "Venue ID is required" });
        const reviews = await reviewCollection.find({ venueId }).sort({ createdAt: -1 }).toArray();
        res.send(reviews);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to fetch reviews." });
    }
};
export const checkCanReview = async (req, res) => {
    try {
        const { venueId, email } = req.params;
        if (!venueId || !email)
            return res.status(400).send({ message: "Venue ID and email are required." });
        const completed = await bookingCollection.findOne({ customerEmail: email, venueId, status: "Completed" });
        const alreadyReviewed = await reviewCollection.findOne({ userEmail: email, venueId });
        res.send({ canReview: !!completed && !alreadyReviewed });
    }
    catch (err) {
        res.status(500).send({ message: "Failed" });
    }
};
export const getUserReviews = async (req, res) => {
    try {
        const { email } = req.params;
        if (!email)
            return res.status(400).send({ message: "Email is required" });
        const reviews = await reviewCollection.find({ userEmail: email }).sort({ createdAt: -1 }).toArray();
        res.send(reviews);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to load reviews." });
    }
};
export const updateReview = async (req, res) => {
    const { id } = req.params;
    const { rating, comment } = req.body;
    const result = await reviewCollection.updateOne({ _id: new ObjectId(id) }, { $set: { rating, comment } });
    res.send(result);
};
export const deleteReview = async (req, res) => {
    const result = await reviewCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    res.send(result);
};
