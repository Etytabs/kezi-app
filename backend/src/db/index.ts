import { drizzle } from "drizzle-orm/node-postgres";
import { pool } from "./postgres";

export const db = drizzle(pool);