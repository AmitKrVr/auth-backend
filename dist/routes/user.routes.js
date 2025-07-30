import { Router } from "express";
import { changeUserPassword, updateUserProfile } from "../controllers/user.controller";
import { authenticateToken } from "../middleware/auth.middleware";
const router = Router();
router.patch("/profile", authenticateToken, updateUserProfile);
router.patch("/password", authenticateToken, changeUserPassword);
export default router;
