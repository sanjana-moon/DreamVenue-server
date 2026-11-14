import { ObjectId } from "mongodb";
import { venueCollection, bookingCollection } from "../config/db.js";
export const getVendorStats = async (req, res) => {
    try {
        const { email } = req.params;
        if (!email)
            return res.status(400).send({ message: "Email is required" });
        const venues = await venueCollection.find({ vendorEmail: email }).toArray();
        const totalVenues = venues.length;
        const venueIds = venues.map((v) => v._id.toString());
        const bookings = await bookingCollection.find({ venueId: { $in: venueIds } }).toArray();
        const pendingRequests = bookings.filter((b) => b.status === "Pending").length;
        const totalEarnings = bookings.reduce((total, b) => total + Number(b.totalPrice || 0), 0);
        const popularVenues = venues
            .sort((a, b) => (b.bookingCount || 0) - (a.bookingCount || 0))
            .slice(0, 5)
            .map((v) => ({ name: v.name, bookings: v.bookingCount || 0 }));
        const monthlyEarnings = {};
        bookings.forEach((b) => {
            const month = new Date(b.createdAt).toLocaleString("default", { month: "short" });
            monthlyEarnings[month] = (monthlyEarnings[month] || 0) + Number(b.totalPrice || 0);
        });
        const earningsChart = Object.entries(monthlyEarnings).map(([month, earnings]) => ({ month, earnings }));
        res.send({ totalVenues, totalEarnings, pendingRequests, popularVenues, earningsChart });
    }
    catch (error) {
        res.status(500).send({ message: "Failed to load vendor dashboard stats" });
    }
};
export const getVendorBookings = async (req, res) => {
    try {
        const email = req.params.email;
        if (!email)
            return res.status(400).send({ message: "Email is required." });
        const venues = await venueCollection.find({ vendorEmail: email }).toArray();
        const venueIds = venues.map((v) => v._id.toString());
        const bookings = await bookingCollection
            .find({ venueId: { $in: venueIds } })
            .sort({ createdAt: -1 })
            .toArray();
        res.send(bookings);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to fetch bookings" });
    }
};
export const updateVendorBookingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
        if (!allowedStatuses.includes(status))
            return res.status(400).send({ message: "Invalid status" });
        await bookingCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
        res.send({ success: true, status });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to update booking" });
    }
};
