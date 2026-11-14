import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as bookingController from "../controllers/booking.controller.js";

const router = Router();

router.post("/bookings", bookingController.createBooking);
router.get("/bookings/customer/:email", verifyToken, bookingController.getCustomerBookings);
router.get("/customer-stats/:email", verifyToken, bookingController.getCustomerStats);

export default router;