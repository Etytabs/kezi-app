import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import { env } from "./config/env";
import { validateEnv } from "./config/validateEnv";
import { pool } from "./db/postgres";

import chatRoutes from "./routes/chat.routes";
import authRoutes from "./routes/auth.routes";
import conversationRoutes from "./routes/conversation.routes";
import cycleRoutes from "./routes/cycle.routes";
import periodRoutes from "./routes/period.routes";
import calendarRoutes from "./routes/calendar.routes";
import statsRoutes from "./routes/stats.routes";
import userRoutes from "./routes/user.routes";

validateEnv();

const app = express();

/* ---------------- PORT CONFIG ---------------- */

const PORT: number = Number(process.env.PORT) || env.PORT || 3001;

/* ---------------- CORS ---------------- */

app.use(
  cors({
    origin: true,
    credentials: true
  })
);

/* ---------------- SECURITY ---------------- */

app.use(
  helmet({
    crossOriginResourcePolicy: false
  })
);

app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many requests, please try again later"
  }
});

app.use(limiter);

/* ---------------- BODY PARSER ---------------- */

app.use(express.json());

/* ---------------- HEALTH CHECK ---------------- */

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    api: "running",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    api: "running",
    timestamp: new Date(),
    environment: process.env.NODE_ENV || "development"
  });
});

app.get("/health/db", async (req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected"
    });

  } catch (error) {

    res.status(500).json({
      status: "error",
      database: "failed"
    });

  }
});

/* ---------------- ROOT ---------------- */

app.get("/", (req, res) => {
  res.json({
    message: "🚀 Kezi Backend running"
  });
});

/* ---------------- API ROUTES ---------------- */

app.use("/api/auth", authRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/cycle", cycleRoutes);
app.use("/api/period", periodRoutes);
app.use("/api/cycle/calendar", calendarRoutes);
app.use("/api/cycle/stats", statsRoutes);
app.use("/api/user", userRoutes);

/* ---------------- 404 ---------------- */

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found"
  });
});

/* ---------------- ERROR HANDLER ---------------- */

app.use((err: any, req: any, res: any, next: any) => {

  console.error("SERVER ERROR:", err);

  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error"
  });

});

/* ---------------- START SERVER ---------------- */

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Kezi API running on port ${PORT}`);
});