import Joi from "joi";
import { email, newPassword } from "./common.js";

/**
 * Validation schema for user registration
 */
export const registerSchema = Joi.object({
    name: Joi.string()
        .trim()
        .min(2)
        .max(50)
        .required()
        .messages({
            "string.min": "Name must be at least 2 characters long",
            "string.max": "Name cannot exceed 50 characters",
            "string.empty": "Name is required",
            "any.required": "Name is required",
        }),

    email: email.required().messages({ "any.required": "Email is required" }),

    password: newPassword.required().messages({ "any.required": "Password is required" }),

    confirmPassword: Joi.string()
        .valid(Joi.ref("password"))
        .required()
        .messages({
            "any.only": "Passwords must match",
            "any.required": "Please confirm your password",
        }),

    bio: Joi.string()
        .trim()
        .max(200)
        .optional()
        .allow("")
        .messages({
            "string.max": "Bio cannot exceed 200 characters",
        }),
});

/**
 * Validation schema for user login
 * (no password policy here - existing accounts may have older, shorter passwords)
 */
export const loginSchema = Joi.object({
    email: email.required().messages({ "any.required": "Email is required" }),

    password: Joi.string()
        .max(128)
        .required()
        .messages({
            "string.empty": "Password is required",
            "any.required": "Password is required",
        }),
});
