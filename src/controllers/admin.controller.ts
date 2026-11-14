import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { venueCollection, bookingCollection, paymentCollection, usersCollection } from "../config/db.js";
import { ApprovalStatus, PublishStatus, UserRole, BookingStatus } from "../types/index.js";

export const getPendingVenues = async (req: Request, res: Response) => {
    try {
        const venues = await venueCollection.find({ approvalStatus: "pending" }).sort({ createdAt: -1 }).toArray();
        res.send(venues);
    } catch (err) {
        res.status(500).send({ message: "Failed to fetch pending venues." });
    }
};

export const getAllVenues = async (req: Request, res: Response) => {
    try {
        const { status } = req.query as { status?: string };
        const query: Record<string, unknown> = {};
        if (status && status !== "all") query.approvalStatus = status;

        const result = await venueCollection.find(query).sort({ createdAt: -1 }).toArray();
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch venues" });
    }
};

export const updateVenueApproval = async (req: Request, res: Response) => {
    const id = req.params.id;
    const { approvalStatus } = req.body as { approvalStatus: ApprovalStatus };

    if (!approvalStatus) return res.status(400).send({ message: "approvalStatus is required" });

    const result = await venueCollection.updateOne({ _id: new ObjectId(id as string) }, { $set: { approvalStatus } });
    res.send(result);
};

export const updateVenuePublish = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { publishStatus } = req.body as { publishStatus: PublishStatus };
        if (!publishStatus) return res.status(400).send({ message: "publishStatus is required" });

        await venueCollection.updateOne({ _id: new ObjectId(id as string) }, { $set: { publishStatus } });
        res.send({ success: true, publishStatus });
    } catch (err) {
        res.status(500).send({ message: "Failed to update publish status." });
    }
};

export const deleteVenueAdmin = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = await venueCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).send({ message: "Venue not found" });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Failed to delete venue" });
    }
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await usersCollection.find({ role: { $ne: "admin" } }).sort({ name: 1 }).toArray();
        res.send(users);
    } catch (err) {
        res.status(500).send({ message: "Failed to fetch users" });
    }
};

export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body as { role: UserRole };
        const allowedRoles: UserRole[] = ["customer", "vendor", "admin"];
        if (!allowedRoles.includes(role)) return res.status(400).send({ message: "Invalid role" });

        await usersCollection.updateOne({ _id: new ObjectId(id as string) }, { $set: { role } });
        res.send({ success: true });
    } catch (err) {
        res.status(500).send({ message: "Failed to update role" });
    }
};

export const blockUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { isBlocked } = req.body as { isBlocked: boolean };
        await usersCollection.updateOne({ _id: new ObjectId(id as string) }, { $set: { isBlocked: !!isBlocked } });
        res.send({ success: true, isBlocked: !!isBlocked });
    } catch (err) {
        res.status(500).send({ message: "Failed to update block status" });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = await usersCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).send({ message: "User not found" });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Failed to delete user" });
    }
};

export const getTransactions = async (req: Request, res: Response) => {
    try {
        const payments = await paymentCollection.find().sort({ paidAt: -1 }).toArray();
        const transactions = await Promise.all(
            payments.map(async (payment) => {
                const venue = await venueCollection.findOne({ _id: new ObjectId(payment.venueId) });
                return {
                    _id: payment._id,
                    transactionId: payment.transactionId,
                    userEmail: payment.userEmail,
                    vendorEmail: venue?.vendorEmail || "N/A",
                    amount: payment.amount,
                    paidAt: payment.paidAt,
                };
            })
        );
        res.send(transactions);
    } catch (err) {
        res.status(500).send({ message: "Failed to fetch transactions" });
    }
};

export const getAdminDashboard = async (req: Request, res: Response) => {
    try {
        const totalUsers = await usersCollection.countDocuments({ role: { $ne: "admin" } });
        const totalVenues = await venueCollection.countDocuments();
        const totalBookings = await bookingCollection.countDocuments();
        const payments = await paymentCollection.find().toArray();
        const totalRevenue = payments.reduce((sum, item) => sum + Number(item.amount || 0), 0);

        const categoryStats = await venueCollection.aggregate([{ $group: { _id: "$category", value: { $sum: 1 } } }]).toArray();
        const venuesByCategory = categoryStats.map((item) => ({ category: item._id, value: item.value }));

        res.send({ totalUsers, totalVenues, totalBookings, totalRevenue, venuesByCategory });
    } catch (err) {
        res.status(500).send({ message: "Failed to load dashboard" });
    }
};

export const getAllBookingsAdmin = async (req: Request, res: Response) => {
    try {
        const bookings = await bookingCollection.find().sort({ createdAt: -1 }).toArray();
        res.send(bookings);
    } catch (error) {
        res.status(500).send({ message: "Failed to fetch bookings" });
    }
};

export const updateBookingStatusAdmin = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { status } = req.body;
        const allowedStatuses: BookingStatus[] = ["Pending", "Confirmed", "Completed", "Cancelled"];
        if (!allowedStatuses.includes(status)) return res.status(400).send({ message: "Invalid booking status" });

        await bookingCollection.updateOne({ _id: new ObjectId(id) }, { $set: { status } });
        res.send({ success: true });
    } catch (error) {
        res.status(500).send({ message: "Failed to update booking" });
    }
};

export const deleteBookingAdmin = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const result = await bookingCollection.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) return res.status(404).send({ message: "Booking not found" });
        res.send(result);
    } catch (error) {
        res.status(500).send({ message: "Failed to delete booking" });
    }
};