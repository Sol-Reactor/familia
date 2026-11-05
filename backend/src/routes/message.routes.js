import { Router } from "express";
import {
    sendMessage,
    getConversation,
    getConversations,
    markConversationRead,
    deleteMessage
} from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { sendMessageSchema } from "../validations/message.validation.js";

const router = Router();

// Anti-spam: max 30 messages per minute per IP
const messageLimiter = rateLimit({ windowMs: 60 * 1000, max: 30, message: "You're sending messages too fast. Slow down a little." });

// All message routes require authentication
router.post("/", authenticate, messageLimiter, validateRequest(sendMessageSchema), sendMessage);
router.get("/conversations", authenticate, getConversations);
router.put("/:userId/read", authenticate, markConversationRead);
router.get("/:userId", authenticate, getConversation);
router.delete("/:messageId", authenticate, deleteMessage);

export default router;
