import { Router } from "express";
import {
    createPost,
    getPosts,
    getPostById,
    updatePost,
    deletePost,
    toggleLike,
    addComment,
    getComments
} from "../controllers/post.controller.js";
import { authenticate } from "../middleware/auth.js";
import { validateRequest } from "../middleware/validation.js";
import {
    createPostSchema,
    updatePostSchema,
    addCommentSchema
} from "../validations/post.validation.js";
import { uploadPostImage, handleUploadError } from "../middleware/upload.middleware.js";

const router = Router();

// Post CRUD operations
router.post("/",
    authenticate,
    uploadPostImage.single("image"),
    handleUploadError,
    validateRequest(createPostSchema),
    createPost
);
router.get("/", authenticate, getPosts);
router.get("/:id", authenticate, getPostById);
router.put("/:id",
    authenticate,
    uploadPostImage.single("image"),
    handleUploadError,
    validateRequest(updatePostSchema),
    updatePost
);
router.delete("/:id", authenticate, deletePost);

// Like/Unlike post
router.post("/:id/like", authenticate, toggleLike);

// Comments
router.post("/:id/comments", authenticate, validateRequest(addCommentSchema), addComment);
router.get("/:id/comments", authenticate, getComments);

export default router;
