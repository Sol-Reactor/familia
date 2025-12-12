import Joi from "joi";

/**
 * Validation schema for sending a message
 */
export const sendMessageSchema = Joi.object({
    receiverId: Joi.string()
        .required()
        .messages({
            "any.required": "Receiver ID is required"
        }),

    content: Joi.string()
        .min(1)
        .max(1000)
        .required()
        .messages({
            "string.min": "Message cannot be empty",
            "string.max": "Message cannot exceed 1000 characters",
            "any.required": "Message content is required"
        })
});
