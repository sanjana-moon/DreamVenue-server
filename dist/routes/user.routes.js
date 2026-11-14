import { Router } from "express";
import { verifyToken } from "../middleware/auth.js";
import * as userController from "../controllers/user.controller.js";
const router = Router();
router.get("/profile", verifyToken, userController.getProfile);
router.put("/profile", verifyToken, userController.updateProfile);
export default router;
