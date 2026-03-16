import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getCalendar } from "../controllers/calendar.controller";

const router = Router();

router.get("/", authMiddleware, getCalendar);

export default router;