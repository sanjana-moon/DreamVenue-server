import { ObjectId } from "mongodb";
import { venueCollection, bookingCollection } from "../config/db.js";
export const getVenues = async (req, res) => {
    try {
        const { search = "", category, minPrice, maxPrice, sort, page = "1", limit = "8", } = req.query;
        const currentPage = Number(page);
        const pageSize = Number(limit);
        const query = { approvalStatus: "approved" };
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: "i" } },
                { location: { $regex: search, $options: "i" } },
            ];
        }
        if (category && category !== "all")
            query.category = category;
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
};
export const getBookedDates = async (req, res) => {
    try {
        const id = req.params.id;
        if (!id)
            return res.status(400).send({ message: "Venue ID is required." });
        const bookings = await bookingCollection
            .find({ venueId: id, status: { $in: ["Pending", "Confirmed"] } })
            .toArray();
        res.send({ bookedDates: bookings.map((b) => b.bookingDate) });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to fetch booked dates." });
    }
};
export const getSingleVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await venueCollection.findOne({ _id: new ObjectId(id) });
        if (!result)
            return res.status(404).send({ message: "Venue not found" });
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to fetch venue" });
    }
};
export const getVendorVenues = async (req, res) => {
    const email = req.params.email;
    if (!email)
        return res.status(400).send({ message: "Email is required" });
    const result = await venueCollection
        .find({ vendorEmail: email })
        .sort({ createdAt: -1 })
        .toArray();
    res.send(result);
};
export const createVenue = async (req, res) => {
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
};
export const updateVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedData = req.body;
        const result = await venueCollection.updateOne({ _id: new ObjectId(id) }, {
            $set: {
                ...updatedData,
                pricePerEvent: Number(updatedData.pricePerEvent),
                capacity: Number(updatedData.capacity),
            },
        });
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to update venue" });
    }
};
export const deleteVenue = async (req, res) => {
    try {
        const { id } = req.params;
        const venue = await venueCollection.findOne({ _id: new ObjectId(id) });
        if (!venue)
            return res.status(404).send({ message: "Venue not found" });
        if (venue.vendorEmail !== req.user?.email) {
            return res.status(403).send({ message: "Not authorized to delete this venue" });
        }
        const result = await venueCollection.deleteOne({ _id: new ObjectId(id) });
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to delete venue" });
    }
};
