import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getPrediction } from "../controllers/cycle.controller";

const router = Router();

router.get("/prediction", authMiddleware, getPrediction);

export default router;
