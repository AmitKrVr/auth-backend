import { Request, Response } from "express";
import z from "zod";
import { db } from "../database/index.js";
import { users } from "../database/schema.js";
import { and, eq } from "drizzle-orm";
import bcrypt from "bcrypt";


export const updateUserSchema = z.object({
    fullName: z.string().min(1, "Full name cannot be empty").optional(),
    email: z.string().email("Invalid email address").optional(),
    mobileNo: z.string().regex(/^\d{10}$/, "Mobile number must be 10 digits").optional(),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmNewPassword: z.string().min(6, "Confirm new password is required"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmNewPassword"],
});

export async function updateUserProfile(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string' || !req.user.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User information missing" });
    }

    const userId = req.user.userId;
    const parsed = updateUserSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: parsed.error?.flatten().fieldErrors,
        });
    }

    const { fullName, email, mobileNo } = parsed.data;

    if (!fullName && !email && !mobileNo) {
        return res.status(400).json({ success: false, message: "No fields provided for update." });
    }

    try {
        const updatePayload: { fullName?: string; email?: string; mobileNo?: string; updatedAt: Date } = {
            updatedAt: new Date(),
        };
        if (fullName !== undefined) {
            updatePayload.fullName = fullName;
        }

        if (email !== undefined) {
            if (email) {
                const existingEmailUser = await db
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

                if (existingEmailUser.length > 0 && existingEmailUser[0].id !== userId) {
                    return res.status(409).json({ success: false, message: "Email address already in use by another account." });
                }
            }
            updatePayload.email = email;
        }

        if (mobileNo !== undefined) {
            if (mobileNo) {
                const existingMobileUser = await db
                    .select({ id: users.id })
                    .from(users)
                    .where(eq(users.mobileNo, mobileNo))
                    .limit(1);

                if (existingMobileUser.length > 0 && existingMobileUser[0].id !== userId) {
                    return res.status(409).json({ success: false, message: "Mobile number already in use by another account." });
                }
            }
            updatePayload.mobileNo = mobileNo;
        }

        const [updatedUser] = await db
            .update(users)
            .set(updatePayload)
            .where(eq(users.id, userId))
            .returning({
                id: users.id,
                fullName: users.fullName,
                email: users.email,
                mobileNo: users.mobileNo,
                updatedAt: users.updatedAt
            });

        if (!updatedUser) {
            return res.status(404).json({ success: false, message: "User not found or nothing to update." });
        }

        res.status(200).json({
            success: true,
            message: "Profile updated successfully!",
            user: {
                id: updatedUser.id,
                fullName: updatedUser.fullName,
                email: updatedUser.email,
                mobileNo: updatedUser.mobileNo,
                updatedAt: updatedUser.updatedAt
            },
        });
    } catch (err) {
        console.error("Update Profile Error:", err);
        res.status(500).json({ success: false, error: "Server error during profile update" });
    }
}

export async function changeUserPassword(req: Request, res: Response) {
    if (!req.user || typeof req.user === 'string' || !req.user.userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User information missing" });
    }

    const userId = req.user.userId;
    const parsed = changePasswordSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            error: parsed.error?.flatten().fieldErrors,
        });
    }

    const { currentPassword, newPassword } = parsed.data;

    try {
        const user = await db
            .select()
            .from(users)
            .where(eq(users.id, userId))
            .limit(1);

        if (!user || user.length === 0) {
            return res.status(404).json({ success: false, message: "User not found." });
        }

        const foundUser = user[0];

        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, foundUser.password);

        if (!isCurrentPasswordValid) {
            return res.status(401).json({ success: false, message: "Incorrect current password." });
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        const [updatedUser] = await db
            .update(users)
            .set({
                password: hashedNewPassword,
                updatedAt: new Date(),
            })
            .where(eq(users.id, userId))
            .returning({ id: users.id, email: users.email });

        if (!updatedUser) {
            throw new Error("Failed to update password.");
        }

        res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (err) {
        console.error("Change Password Error:", err);
        res.status(500).json({ success: false, error: "Server error during password change" });
    }
}