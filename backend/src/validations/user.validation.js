import Joi from "joi";

/**
 * Validation schema for updating user profile
 * Note: profilePicture and coverPhoto are handled by multer middleware, not validated here
 */
export const updateProfileSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(50)
        .optional()
        .allow(null)
        .messages({
            "string.min": "Name must be at least 2 characters long",
            "string.max": "Name cannot exceed 50 characters"
        }),

    username: Joi.string()
        .min(2)
        .max(50)
        .optional()
        .allow(null, "")
        .messages({
            "string.min": "Username must be at least 2 characters long",
            "string.max": "Username cannot exceed 50 characters"
        }),

    bio: Joi.string()
        .max(200)
        .optional()
        .allow("", null)
        .messages({
            "string.max": "Bio cannot exceed 200 characters"
        }),

    location: Joi.string().max(100).optional().allow("", null),
    website: Joi.string().uri().optional().allow("", null),
    avatarUrl: Joi.string().uri().optional().allow("", null),
    coverUrl: Joi.string().uri().optional().allow("", null)
}).unknown(true); // Allow unknown fields (like profilePicture from multer)

/**
 * Validation schema for updating password
 */
export const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .required()
        .messages({
            "any.required": "Current password is required"
        }),

    newPassword: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.min": "New password must be at least 6 characters long",
            "any.required": "New password is required"
        })
});
