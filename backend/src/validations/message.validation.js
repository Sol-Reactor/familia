import Joi from "joi";

/**
 * Validation schema for sending a message
 */
export const sendMessageSchema = Joi.object({
    receiverId: Joi.string()
        .trim()
        .max(64)
        .required()
        .messages({
            "any.required": "Receiver ID is required"
        }),

    content: Joi.string()
        .trim()
        .min(1)
        .max(1000)
        .required()
        .messages({
            "string.empty": "Message cannot be empty",
            "string.min": "Message cannot be empty",
            "string.max": "Message cannot exceed 1000 characters",
            "any.required": "Message content is required"
        })
});
