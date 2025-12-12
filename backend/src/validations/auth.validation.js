import Joi from "joi";

/**
 * Validation schema for user registration
 */
export const registerSchema = Joi.object({
    name: Joi.string()
        .min(2)
        .max(15)
        .required()
        .messages({
            "string.min": "Name must be at least 2 characters long",
            "string.max": "Name cannot exceed 15 characters",
            "any.required": "Name is required"
        }),

    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.email": "Please provide a valid email address",
            "any.required": "Email is required"
        }),

    password: Joi.string()
        .min(6)
        .required()
        .messages({
            "string.min": "Password must be at least 6 characters long",
            "any.required": "Password is required"
        }),

    confirmPassword: Joi.string()
        .valid(Joi.ref('password'))
        .required()
        .messages({
            "any.only": "Passwords must match",
            "any.required": "Please confirm your password"
        }),

    bio: Joi.string()
        .max(200)
        .optional()
        .allow("")
        .messages({
            "string.max": "Bio cannot exceed 200 characters"
        })
});

/**
 * Validation schema for user login
 */
export const loginSchema = Joi.object({
    email: Joi.string()
        .email()
        .required()
        .messages({
            "string.email": "Please provide a valid email address",
            "any.required": "Email is required"
        }),

    password: Joi.string()
        .required()
        .messages({
            "any.required": "Password is required"
        })
});
