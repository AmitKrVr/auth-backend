import { RequestHandler, Router } from "express";
import { changeUserPassword, updateUserProfile } from "../controllers/user.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";

const router = Router();

router.patch("/profile", authenticateToken, updateUserProfile as RequestHandler);
router.patch("/password", authenticateToken, changeUserPassword as RequestHandler);


export default router;