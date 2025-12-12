import { Router } from "express";
import {
    sendMessage,
    getConversation,
    getConversations,
    deleteMessage
} from "../controllers/message.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import { sendMessageSchema } from "../validations/message.validation.js";

const router = Router();

// All message routes require authentication
router.post("/", authenticate, validateRequest(sendMessageSchema), sendMessage);
router.get("/conversations", authenticate, getConversations);
router.get("/:userId", authenticate, getConversation);
router.delete("/:messageId", authenticate, deleteMessage);

export default router;
