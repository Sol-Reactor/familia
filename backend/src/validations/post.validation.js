import Joi from "joi";
import { imageUrl } from "./common.js";

/**
 * Validation schema for creating a post
 * Note: a multipart "image" FILE is handled by multer; "image" in the body is a pre-uploaded Cloudinary URL
 */
export const createPostSchema = Joi.object({
    content: Joi.string()
        .trim()
        .max(5000)
        .allow('', null)
        .optional()
        .messages({
            "string.max": "Post content cannot exceed 5000 characters"
        }),
    image: imageUrl
        .allow(null, '')
        .optional()
});

/**
 * Validation schema for updating a post
 */
export const updatePostSchema = Joi.object({
    content: Joi.string()
        .trim()
        .min(1)
        .max(5000)
        .optional()
        .messages({
            "string.empty": "Post content cannot be empty",
            "string.min": "Post content cannot be empty",
            "string.max": "Post content cannot exceed 5000 characters"
        })
});

/**
 * Validation schema for adding a comment
 */
export const addCommentSchema = Joi.object({
    content: Joi.string()
        .trim()
        .min(1)
        .max(500)
        .required()
        .messages({
            "string.empty": "Comment cannot be empty",
            "string.min": "Comment cannot be empty",
            "string.max": "Comment cannot exceed 500 characters",
            "any.required": "Comment content is required"
        })
});
