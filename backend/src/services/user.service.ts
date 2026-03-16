import { db } from "../db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

export async function createUser(email: string, password: string) {
  return db.insert(users).values({ email, password });
}

export async function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email));
}