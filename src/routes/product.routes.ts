import { RequestHandler, Router } from "express";
import { createProduct, deleteProduct, getProductById, getProducts, updateProduct } from "../controllers/product.controller.js";
import { authenticateToken } from "../middleware/auth.middleware.js";
import upload from "../middleware/multerConfig.js";

const router = Router();

router.post("/", authenticateToken, upload.single('image'), createProduct as RequestHandler);
router.get("/", getProducts as RequestHandler);
router.get("/:id", getProductById as RequestHandler);
router.patch("/:id", authenticateToken, upload.single('image'), updateProduct as RequestHandler);
router.delete("/:id", authenticateToken, deleteProduct as RequestHandler);

export default router;