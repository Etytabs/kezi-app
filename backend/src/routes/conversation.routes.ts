import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import {
  getConversations,
  getMessages
} from "../controllers/conversation.controller";

const router = Router();

router.get("/", authMiddleware, getConversations);

router.get("/:id/messages", authMiddleware, getMessages);

export default router;