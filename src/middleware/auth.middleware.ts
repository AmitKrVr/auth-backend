import jwt, { JwtPayload } from "jsonwebtoken"
import { NextFunction, Request, Response } from "express";
import config from "../config.js";

declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                email: string;
                fullName: string;
            };
        }
    }
}

export async function authenticateToken(req: Request, res: Response, next: NextFunction): Promise<void> {
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
        const decoded = jwt.verify(token, config.env.JWT_SECRET) as {
            userId: string;
            email: string;
            fullName: string;
        };

        req.user = decoded;

        next();
    } catch (error) {
        res.status(403).json({
            success: false,
            message: "Invalid or expired token"
        });
    }
}