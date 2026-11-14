import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as reviewController from "../controllers/review.controller.js";

const router = Router();

router.post("/reviews", verifyToken, reviewController.createReview);
router.get("/venues/:venueId/reviews", reviewController.getVenueReviews);
router.get("/venues/:venueId/can-review/:email", reviewController.checkCanReview);
router.get("/user/reviews/:email", reviewController.getUserReviews);
router.patch("/reviews/:id", verifyToken, reviewController.updateReview);
router.delete("/reviews/:id", verifyToken, reviewController.deleteReview);

export default router;