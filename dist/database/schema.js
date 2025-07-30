import { numeric, pgTable, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";
export const users = pgTable("users", {
    id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
    fullName: varchar("full_name", { length: 255 }).notNull(),
    mobileNo: varchar('mobile_number', { length: 15 }).notNull().unique(),
    email: text("email").notNull().unique(),
    password: text("password").notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
});
export const products = pgTable("products", {
    id: uuid("id").notNull().primaryKey().defaultRandom().unique(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    price: numeric("price", { precision: 10, scale: 2 }).notNull(),
    originalPrice: numeric("original_price", { precision: 10, scale: 2 }),
    discountedPrice: numeric("discounted_price", { precision: 10, scale: 2 }),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
