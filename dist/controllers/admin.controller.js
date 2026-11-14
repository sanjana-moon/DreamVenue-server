import { ObjectId } from "mongodb";
import { venueCollection, bookingCollection, paymentCollection, usersCollection } from "../config/db.js";
export const getPendingVenues = async (req, res) => {
    try {
        const venues = await venueCollection.find({ approvalStatus: "pending" }).sort({ createdAt: -1 }).toArray();
        res.send(venues);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to fetch pending venues." });
    }
};
export const getAllVenues = async (req, res) => {
    try {
        const { status } = req.query;
        const query = {};
        if (status && status !== "all")
            query.approvalStatus = status;
        const result = await venueCollection.find(query).sort({ createdAt: -1 }).toArray();
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to fetch venues" });
    }
};
export const updateVenueApproval = async (req, res) => {
    const id = req.params.id;
    const { approvalStatus } = req.body;
    if (!approvalStatus)
        return res.status(400).send({ message: "approvalStatus is required" });
    const result = await venueCollection.updateOne({ _id: new ObjectId(id) }, { $set: { approvalStatus } });
    res.send(result);
};
export const updateVenuePublish = async (req, res) => {
    try {
        const { id } = req.params;
        const { publishStatus } = req.body;
        if (!publishStatus)
            return res.status(400).send({ message: "publishStatus is required" });
        await venueCollection.updateOne({ _id: new ObjectId(id) }, { $set: { publishStatus } });
        res.send({ success: true, publishStatus });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to update publish status." });
    }
};
export const deleteVenueAdmin = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await venueCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0)
            return res.status(404).send({ message: "Venue not found" });
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to delete venue" });
    }
};
export const getUsers = async (req, res) => {
    try {
        const users = await usersCollection.find({ role: { $ne: "admin" } }).sort({ name: 1 }).toArray();
        res.send(users);
    }
    catch (err) {
        res.status(500).send({ message: "Failed to fetch users" });
    }
};
export const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        const allowedRoles = ["customer", "vendor", "admin"];
        if (!allowedRoles.includes(role))
            return res.status(400).send({ message: "Invalid role" });
        await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { role } });
        res.send({ success: true });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to update role" });
    }
};
export const blockUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body;
        await usersCollection.updateOne({ _id: new ObjectId(id) }, { $set: { isBlocked: !!isBlocked } });
        res.send({ success: true, isBlocked: !!isBlocked });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to update block status" });
    }
};
export const deleteUser = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0)
            return res.status(404).send({ message: "User not found" });
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to delete user" });
    }
};
export const getTransactions = async (req, res) => {
    try {
        const payments = await paymentCollection.find().sort({ paidAt: -1 }).toArray();
        const transactions = await Promise.all(payments.map(async (payment) => {
            const venue = await venueCollection.findOne({ _id: new ObjectId(payment.venueId) });
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
        res.status(500).send({ message: "Failed to fetch transactions" });
    }
};
export const getAdminDashboard = async (req, res) => {
    try {
        const totalUsers = await usersCollection.countDocuments({ role: { $ne: "admin" } });
        const totalVenues = await venueCollection.countDocuments();
        const totalBookings = await bookingCollection.countDocuments();
        const payments = await paymentCollection.find().toArray();
        const totalRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);
        const categoryStats = await venueCollection.aggregate([{ $group: { _id: "$category", value: { $sum: 1 } } }]).toArray();
        const venuesByCategory = categoryStats.map((item) => ({ category: item._id, value: item.value }));
        res.send({ totalUsers, totalVenues, totalBookings, totalRevenue, venuesByCategory });
    }
    catch (err) {
        res.status(500).send({ message: "Failed to load dashboard" });
    }
};
export const getAllBookingsAdmin = async (req, res) => {
    try {
        const bookings = await bookingCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(bookings);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to fetch bookings" });
    }
};
export const updateBookingStatusAdmin = async (req, res) => {
    try {
        const id = req.params.id;
        const { status } = req.body;
        const allowedStatuses = ["Pending", "Confirmed", "Completed", "Cancelled"];
        if (!allowedStatuses.includes(status))
            return res.status(400).send({ message: "Invalid booking status" });
        await bookingCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
        res.send({ success: true });
    }
    catch (error) {
        res.status(500).send({ message: "Failed to update booking" });
    }
};
export const deleteBookingAdmin = async (req, res) => {
    try {
        const id = req.params.id;
        const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0)
            return res.status(404).send({ message: "Booking not found" });
        res.send(result);
    }
    catch (error) {
        res.status(500).send({ message: "Failed to delete booking" });
    }
};
