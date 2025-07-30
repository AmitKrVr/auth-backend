import { z } from "zod";
import { eq } from "drizzle-orm";
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { Request, Response } from "express";

import { db } from "../database/index.js";
import { products } from "../database/schema.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const createProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number with up to 2 decimal places"),
    originalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Original price must be a valid number with up to 2 decimal places").optional(),
    discountedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Discounted price must be a valid number with up to 2 decimal places").optional(),
});

export const updateProductSchema = z.object({
    name: z.string().min(1, "Product name cannot be empty").optional(),
    description: z.string().optional(),
    price: z.string().regex(/^\d+(\.\d{1,2})?$/, "Price must be a valid number with up to 2 decimal places").optional(),
    originalPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Original price must be a valid number with up to 2 decimal places").optional(),
    discountedPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Discounted price must be a valid number with up to 2 decimal places").optional(),
});

export async function createProduct(req: Request, res: Response) {

    console.log("--- createProduct hit ---");
    console.log("req.body:", req.body); // Check if text fields are coming through
    console.log("req.file:", req.file);
    const parsed = createProductSchema.safeParse(req.body);

    if (!parsed.success) {
        // If validation fails and a file was uploaded, delete it to prevent orphaned files
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Failed to delete rejected file:", err));
        }
        return res.status(400).json({
            success: false,
            error: parsed.error?.flatten().fieldErrors,
        });
    }

    const { name, description, price, originalPrice, discountedPrice } = parsed.data;
    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null; // Store the URL path

    if (!imageUrl) {
        return res.status(400).json({ success: false, message: "Product image is required." });
    }

    try {
        const [newProduct] = await db
            .insert(products)
            .values({
                name,
                description,
                price,
                originalPrice,
                discountedPrice,
                imageUrl,
            })
            .returning();

        if (!newProduct) {
            throw new Error("Failed to create product.");
        }

        res.status(201).json({
            success: true,
            message: "Product created successfully!",
            product: {
                id: newProduct.id,
                name: newProduct.name,
                description: newProduct.description,
                price: newProduct.price,
                originalPrice: newProduct.originalPrice,
                discountedPrice: newProduct.discountedPrice,
                imageUrl: newProduct.imageUrl,
                createdAt: newProduct.createdAt,
                updatedAt: newProduct.updatedAt,
            },
        });
    } catch (err) {
        console.error("Create Product Error:", err);
        // If database insertion fails after file upload, delete the file
        if (req.file) {
            await fs.unlink(req.file.path).catch(deleteErr => console.error("Failed to delete orphaned file:", deleteErr));
        }
        res.status(500).json({ success: false, error: "Server error during product creation" });
    }
}

export async function getProducts(req: Request, res: Response) {
    try {
        const allProducts = await db.select().from(products);

        res.status(200).json({
            success: true,
            products: allProducts,
        });
    } catch (err) {
        console.error("Get Products Error:", err);
        res.status(500).json({ success: false, error: "Server error fetching products" });
    }
}

export async function getProductById(req: Request, res: Response) {
    const { id } = req.params;

    try {
        const product = await db.select().from(products).where(eq(products.id, id)).limit(1);

        if (!product || product.length === 0) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        res.status(200).json({
            success: true,
            product: product[0],
        });
    } catch (err) {
        console.error("Get Product By ID Error:", err);
        res.status(500).json({ success: false, error: "Server error fetching product" });
    }
}

export async function updateProduct(req: Request, res: Response) {
    const { id } = req.params;
    const parsed = updateProductSchema.safeParse(req.body);

    if (!parsed.success) {
        // If validation fails and a file was uploaded, delete it
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Failed to delete rejected file:", err));
        }
        return res.status(400).json({
            success: false,
            error: parsed.error?.flatten().fieldErrors,
        });
    }

    const { name, description, price, originalPrice, discountedPrice } = parsed.data;
    const newImageUrl = req.file ? `/uploads/images/${req.file.filename}` : undefined;

    const updatePayload: {
        name?: string;
        description?: string | null;
        price?: string;
        originalPrice?: string | null;
        discountedPrice?: string | null;
        imageUrl?: string | null;
        updatedAt: Date
    } = {
        updatedAt: new Date(),
    };

    if (name !== undefined) updatePayload.name = name;
    if (description !== undefined) updatePayload.description = description;
    if (price !== undefined) updatePayload.price = price;
    if (originalPrice !== undefined) updatePayload.originalPrice = originalPrice;
    if (discountedPrice !== undefined) updatePayload.discountedPrice = discountedPrice;

    let oldImageUrl: string | null | undefined;

    if (req.file) {
        updatePayload.imageUrl = newImageUrl;
        const existingProduct = await db.select({ imageUrl: products.imageUrl }).from(products).where(eq(products.id, id)).limit(1);
        if (existingProduct.length > 0) {
            oldImageUrl = existingProduct[0].imageUrl;
        }
    }

    if (Object.keys(updatePayload).length === 1 && updatePayload.updatedAt) {
        if (req.file) {
            await fs.unlink(req.file.path).catch(err => console.error("Failed to delete unused uploaded file:", err));
        }
        return res.status(400).json({ success: false, message: "No valid fields provided for update." });
    }


    try {
        const [updatedProduct] = await db
            .update(products)
            .set(updatePayload)
            .where(eq(products.id, id))
            .returning();

        if (!updatedProduct) {
            // If update fails (e.g., product not found), delete the new file if it was uploaded
            if (req.file) {
                await fs.unlink(req.file.path).catch(err => console.error("Failed to delete orphaned file after update failure:", err));
            }
            return res.status(404).json({ success: false, message: "Product not found or nothing to update." });
        }

        // If update was successful and a new image was uploaded, delete the old image file
        if (req.file && oldImageUrl) {
            const oldFilePath = path.join(__dirname, '../../', oldImageUrl);
            if (oldFilePath.startsWith(path.join(__dirname, '../../uploads'))) {
                await fs.unlink(oldFilePath).catch(err => console.error("Failed to delete old image file:", err));
            } else {
                console.warn("Attempted to delete file outside uploads directory:", oldFilePath);
            }
        }

        res.status(200).json({
            success: true,
            message: "Product updated successfully!",
            product: updatedProduct,
        });
    } catch (err) {
        console.error("Update Product Error:", err);
        // If database update fails, delete the new file if it was uploaded
        if (req.file) {
            await fs.unlink(req.file.path).catch(deleteErr => console.error("Failed to delete orphaned file:", deleteErr));
        }
        res.status(500).json({ success: false, error: "Server error during product update" });
    }
}

export async function deleteProduct(req: Request, res: Response) {
    const { id } = req.params;

    try {
        const productToDelete = await db.select({ imageUrl: products.imageUrl }).from(products).where(eq(products.id, id)).limit(1);

        const [deletedProduct] = await db.delete(products).where(eq(products.id, id)).returning({ id: products.id });

        if (!deletedProduct) {
            return res.status(404).json({ success: false, message: "Product not found." });
        }

        // If the product had an image, delete the file from the disk
        if (productToDelete.length > 0 && productToDelete[0].imageUrl) {
            const imageUrlToDelete = productToDelete[0].imageUrl;
            const filePath = path.join(__dirname, '../../', imageUrlToDelete);
            if (filePath.startsWith(path.join(__dirname, '../../uploads'))) {
                await fs.unlink(filePath).catch(err => console.error("Failed to delete product image file:", err));
            } else {
                console.warn("Attempted to delete file outside uploads directory:", filePath);
            }
        }

        res.status(200).json({ success: true, message: "Product deleted successfully!" });
    } catch (err) {
        console.error("Delete Product Error:", err);
        res.status(500).json({ success: false, error: "Server error during product deletion" });
    }
}