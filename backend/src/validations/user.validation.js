import Joi from "joi";
import { newPassword, webUrl, imageUrl } from "./common.js";

/**
 * Validation schema for updating user profile
 * Note: profilePicture and coverPhoto files are handled by multer, not validated here
 */
export const updateProfileSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .optional()
        .allow(null)
        .messages({
            "string.min": "Name must be at least 2 characters long",
            "string.max": "Name cannot exceed 50 characters",
        }),

    username: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .pattern(/^[A-Za-z0-9._-]+$/)
        .optional()
        .allow(null, "")
        .messages({
            "string.min": "Username must be at least 2 characters long",
            "string.max": "Username cannot exceed 50 characters",
            "string.pattern.base": "Username can only contain letters, numbers, dots, dashes and underscores",
        }),

    bio: Joi.string()
        .trim()
        .max(200)
        .optional()
        .allow("", null)
        .messages({
            "string.max": "Bio cannot exceed 200 characters",
        }),

    location: Joi.string().trim().max(100).optional().allow("", null),
    website: webUrl.optional().allow("", null).messages({
        "string.uri": "Website must be a valid http(s) URL",
        "string.uriCustomScheme": "Website must start with http:// or https://",
    }),
    avatarUrl: imageUrl.optional().allow("", null),
    coverUrl: imageUrl.optional().allow("", null),
});

/**
 * Validation schema for updating password
 */
export const updatePasswordSchema = Joi.object({
    currentPassword: Joi.string()
        .max(128)
        .required()
        .messages({
            "string.empty": "Current password is required",
            "any.required": "Current password is required",
        }),

    newPassword: newPassword
        .required()
        .invalid(Joi.ref("currentPassword"))
        .messages({
            "any.required": "New password is required",
            "any.invalid": "New password must be different from your current password",
        }),
});

/**
 * Deleting an account requires re-entering the password
 */
export const deleteAccountSchema = Joi.object({
    password: Joi.string().max(128).required().messages({
        "string.empty": "Password is required to delete your account",
        "any.required": "Password is required to delete your account",
    }),
});
