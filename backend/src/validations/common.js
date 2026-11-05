import Joi from "joi";

/**
 * Password policy for NEW passwords (register / change password).
 * bcrypt only uses the first 72 bytes, so cap the length there.
 */
export const newPassword = Joi.string()
    .min(8)
    .max(72)
    .pattern(/[A-Za-z]/, "letter")
    .pattern(/\d/, "number")
    .messages({
        "string.min": "Password must be at least 8 characters long",
        "string.max": "Password cannot exceed 72 characters",
        "string.pattern.name": "Password must contain at least one {#name}",
    });

export const email = Joi.string()
    .trim()
    .lowercase()
    .email()
    .max(254)
    .messages({
        "string.email": "Please provide a valid email address",
        "string.empty": "Email is required",
    });

/** Only http(s) links - blocks javascript:, data:, etc. which become XSS when rendered as links. */
export const webUrl = Joi.string().trim().max(2048).uri({ scheme: ["http", "https"] });

/** Uploaded image URLs must be HTTPS and hosted on Cloudinary. */
export const imageUrl = webUrl.custom((value, helpers) => {
    try {
        const url = new URL(value);
        if (url.protocol !== "https:" || url.hostname !== "res.cloudinary.com") {
            return helpers.error("any.invalid");
        }
        return value;
    } catch {
        return helpers.error("any.invalid");
    }
}).messages({ "any.invalid": "Image must be uploaded through Familia" });
