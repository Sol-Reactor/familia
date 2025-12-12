import { Router } from "express";
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriend,
    getFriends,
    getFriendRequests,
    getFriendshipStatus,
    getSuggestedFriends
} from "../controllers/friendship.controller.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// All friendship routes require authentication
router.post("/request/:userId", authenticate, sendFriendRequest);
router.put("/accept/:requestId", authenticate, acceptFriendRequest);
router.put("/reject/:requestId", authenticate, rejectFriendRequest);
router.delete("/:userId", authenticate, unfriend);
router.get("/", authenticate, getFriends);
router.get("/requests", authenticate, getFriendRequests);
router.get("/status/:userId", authenticate, getFriendshipStatus);
router.get("/suggestions", authenticate, getSuggestedFriends);

export default router;
