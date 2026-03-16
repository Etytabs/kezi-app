import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { getProfile } from "../controllers/user.controller";

const router = Router();

router.get("/profile", authMiddleware, getProfile);

export default router;