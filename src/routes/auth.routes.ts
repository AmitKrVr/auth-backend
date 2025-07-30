import { RequestHandler, Router } from "express";
import { loginController, signupController } from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", signupController as RequestHandler);
router.post("/login", loginController as RequestHandler);

export default router;