import { Pool } from "pg";
import { env } from "../config/env";

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: false
});

/* Test connection */

pool
  .connect()
  .then((client) => {
    console.log("✅ PostgreSQL pool connected");
    client.release();
  })
  .catch((err) => {
    console.error("❌ PostgreSQL pool error:", err);
  });