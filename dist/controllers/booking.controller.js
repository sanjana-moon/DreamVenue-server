import { ObjectId } from "mongodb";
import { venueCollection, bookingCollection, paymentCollection } from "../config/db.js";
export const createBooking = async (req, res) => {
    try {
        const { venueId, venueName, bookingDate, guestCount, email, amount, paymentType, transactionId, paymentStatus } = req.body;
        const existingPayment = await paymentCollection.findOne({ transactionId });
        if (existingPayment)
            return res.status(200).send({ message: "Already processed" });
        const conflict = await bookingCollection.findOne({
            venueId,
            bookingDate,
            status: { $in: ["Pending", "Confirmed"] },
        });
        if (conflict)
            return res.status(409).send({ message: "This venue is already booked for the selected date." });
        const bookingData = {
            venueId,
            venueName,
            customerEmail: email,
            bookingDate,
            guestCount: Number(guestCount),
            totalPrice: Number(amount),
            transactionId,
            paymentStatus,
            status: "Pending",
            createdAt: new Date(),
        };
        let bookingResult;
        try {
            bookingResult = await bookingCollection.insertOne(bookingData);
        }
        catch (err) {
            if (err.code === 11000) {
                return res.status(409).send({ message: "This venue has just been booked by another customer." });
            }
            throw err;
        }
        await venueCollection.updateOne({ _id: new ObjectId(venueId) }, { $inc: { bookingCount: 1 } });
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
        res.send({ success: true, booking: bookingResult });
    }
    catch (error) {
        res.status(500).send({ message: "Failed to save booking." });
    }
};
export const getCustomerBookings = async (req, res) => {
    const email = req.params.email;
    if (!email)
        return res.status(400).send({ message: "Email is required." });
    const result = await bookingCollection.find({ customerEmail: email }).sort({ createdAt: -1 }).toArray();
    res.send(result);
};
export const getCustomerStats = async (req, res) => {
    try {
        const { email } = req.params;
        if (!email)
            return res.status(400).send({ message: "Email is required" });
        const bookings = await bookingCollection.find({ customerEmail: email }).toArray();
        const upcomingBookings = bookings.filter((b) => b.status === "Confirmed" || b.status === "Pending").length;
        const completedEvents = bookings.filter((b) => b.status === "Completed").length;
        const totalSpent = bookings.reduce((sum, b) => sum + Number(b.totalPrice || 0), 0);
        const monthlyBookings = {};
        bookings.forEach((b) => {
            const month = new Date(b.createdAt).toLocaleString("default", { month: "short" });
            monthlyBookings[month] = (monthlyBookings[month] || 0) + 1;
        });
        const chartData = Object.entries(monthlyBookings).map(([month, count]) => ({ month, bookings: count }));
        const recentBookings = bookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);
        res.send({ upcomingBookings, completedEvents, totalSpent, chartData, recentBookings });
    }
    catch (error) {
        res.status(500).send({ message: "Failed to load customer dashboard" });
    }
};
