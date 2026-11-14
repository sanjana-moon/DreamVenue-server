import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as vendorController from "../controllers/vendor.controller.js";
const router = Router();
router.get("/vendor-stats/:email", vendorController.getVendorStats);
router.get("/vendor/bookings/:email", verifyToken, vendorController.getVendorBookings);
router.patch("/vendor/bookings/:id", verifyToken, vendorController.updateVendorBookingStatus);
export default router;
