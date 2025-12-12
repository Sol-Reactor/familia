import { Router } from "express";
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications
} from "../controllers/notification.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All notification routes require authentication
router.get("/", authenticate, getNotifications);
router.put("/read/:notificationId", authenticate, markAsRead);
router.put("/read-all", authenticate, markAllAsRead);
router.delete("/:notificationId", authenticate, deleteNotification);
router.delete("/", authenticate, clearAllNotifications);

export default router;
