import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { logPeriod } from "../controllers/period.controller";

const router = Router();

router.post("/log", authMiddleware, logPeriod);

export default router;