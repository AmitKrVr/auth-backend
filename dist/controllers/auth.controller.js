import { z } from "zod";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import config from "../config.js";
import { users } from "../database/schema.js";
import { db } from "../database/index.js";
export const signupSchema = z.object({
    fullName: z.string().min(1, "Full name is required"),
    email: z.string().email("Invalid email address"),
    mobileNo: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});
export const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});
export async function signupController(req, res) {
    const parsed = signupSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: parsed.error?.flatten().fieldErrors,
        });
    }
    const { fullName, email, mobileNo, password } = parsed.data;
    try {
        // checking is user is already registered or not
        const existingUser = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (existingUser.length > 0) {
            return res
                .status(409)
                .json({ success: false, message: "User with this email already exists." });
        }
        // Hashing the password for more security
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is a good salt rounds value
        // if user already not registered then we Insert new user into the database
        const newUser = await db
            .insert(users)
            .values({
            fullName,
            email,
            mobileNo,
            password: hashedPassword,
        })
            .returning({
            id: users.id,
            fullName: users.fullName,
            email: users.email,
            mobileNo: users.mobileNo,
        });
        if (!newUser || newUser.length === 0) {
            throw new Error("Failed to create user.");
        }
        const user = newUser[0];
        // Generate JWT token
        const token = jwt.sign({ userId: user.id, email: user.email, fullName: user.fullName }, config.env.JWT_SECRET, { expiresIn: config.env.jwtExpires });
        res.status(201).json({
            success: true,
            message: "User registered successfully!",
            token: token,
            user: {
                id: user.id,
                fullName: user.fullName,
                email: user.email,
                mobileNo: user.mobileNo,
            },
        });
    }
    catch (err) {
        console.error("Signup Error:", err);
        res.status(500).json({ success: false, error: "Server error during signup" });
    }
}
export async function loginController(req, res) {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: parsed.error?.flatten().fieldErrors,
        });
    }
    const { email, password } = parsed.data;
    try {
        // Find the user by email
        const user = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        if (!user || user.length === 0) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid credentials" });
        }
        const foundUser = user[0];
        // Compare password with the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, foundUser.password);
        if (!isPasswordValid) {
            return res
                .status(401)
                .json({ success: false, message: "Invalid credentials" });
        }
        // Generate JWT token
        const token = jwt.sign({ userId: foundUser.id, email: foundUser.email, fullName: foundUser.fullName }, config.env.JWT_SECRET, { expiresIn: config.env.jwtExpires });
        res.status(200).json({
            success: true,
            message: "Logged in successfully!",
            token: token,
            user: {
                id: foundUser.id,
                fullName: foundUser.fullName,
                email: foundUser.email,
                mobileNo: foundUser.mobileNo,
            },
        });
    }
    catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ success: false, error: "Server error during login" });
    }
}
