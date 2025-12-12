import Joi from "joi";

/**
 * Validation schema for creating a post
 * Note: image upload is handled by multer middleware, not validated here
 */
export const createPostSchema = Joi.object({
    content: Joi.string()
        .max(5000)
        .allow('', null)
        .optional()
        .messages({
            "string.max": "Post content cannot exceed 5000 characters"
        }),
    image: Joi.string()
        .uri()
        .allow(null)
        .optional()
}).or('content', 'image');

/**
 * Validation schema for updating a post
 * Note: image upload is handled by multer middleware, not validated here
 */
export const updatePostSchema = Joi.object({
    content: Joi.string()
        .min(1)
        .max(5000)
        .optional()
        .messages({
            "string.min": "Post content cannot be empty",
            "string.max": "Post content cannot exceed 5000 characters"
        })
});

/**
 * Validation schema for adding a comment
 */
export const addCommentSchema = Joi.object({
    content: Joi.string()
        .min(1)
        .max(500)
        .required()
        .messages({
            "string.min": "Comment cannot be empty",
            "string.max": "Comment cannot exceed 500 characters",
            "any.required": "Comment content is required"
        })
});
