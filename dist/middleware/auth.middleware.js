import jwt from "jsonwebtoken";
import config from "../config.js";
export async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            res.status(401).json({
                success: false,
                message: "No token provided"
            });
            return;
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, config.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(403).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}
