import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),

  email: text("email").notNull().unique(),
  password: text("password").notNull(),

  name: text("name"),
  role: text("role").default("user"),

  language: text("language").default("en"),

  createdAt: timestamp("created_at").defaultNow()
});

export const chats = pgTable("chats", {
  id: uuid("id").primaryKey().defaultRandom(),

  userId: uuid("user_id"),

  message: text("message").notNull(),
  response: text("response"),

  createdAt: timestamp("created_at").defaultNow()
});