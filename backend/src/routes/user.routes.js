import { Router } from "express";
import {
    getUsers,
    getMyProfile,
    getUserById,
    updateMyProfile,
    updatePassword,
    deleteMyAccount
} from "../controllers/user.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import {
    updateProfileSchema,
    updatePasswordSchema
} from "../validations/user.validation.js";
import { uploadProfileImage, handleUploadError } from "../middleware/upload.middleware.js";

const router = Router();

// Protected routes - /me/profile MUST come before /:id
router.get("/me/profile", authenticate, getMyProfile);
router.put("/me/profile",
    authenticate,
    uploadProfileImage.fields([
        { name: "profilePicture", maxCount: 1 },
        { name: "coverPhoto", maxCount: 1 }
    ]),
    handleUploadError,
    validateRequest(updateProfileSchema),
    updateMyProfile
);
router.put("/me/password",
    authenticate,
    validateRequest(updatePasswordSchema),
    updatePassword
);
router.delete("/me/account", authenticate, deleteMyAccount);

// Public routes (with authentication to see who's logged in)
router.get("/", authenticate, getUsers);
router.get("/:id", authenticate, getUserById);

export default router;
