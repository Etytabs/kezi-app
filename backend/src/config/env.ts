import dotenv from "dotenv";
import path from "path";

/* Load root .env */
dotenv.config({
  path: path.resolve(process.cwd(), "../.env"),
  override: true
});

/* Validate required variables */
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is missing in environment variables");
}

export const env = {
  PORT: Number(process.env.PORT) || 3001,
  DATABASE_URL: process.env.DATABASE_URL,
  JWT_SECRET: process.env.JWT_SECRET || "dev-secret",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || ""
};

console.log("✅ Environment variables loaded");
console.log("DATABASE_URL VALUE:", env.DATABASE_URL);