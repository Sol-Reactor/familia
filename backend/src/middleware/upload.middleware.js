import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.config.js";

/**
 * Cloudinary storage configuration for profile images
 */
const profileStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "facebook-clone/profiles",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ width: 500, height: 500, crop: "limit" }],
    },
});

/**
 * Cloudinary storage configuration for post images
 */
const postStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "facebook-clone/posts",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [{ width: 1200, height: 1200, crop: "limit" }],
    },
});

/**
 * File filter to only accept images
 */
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed!"), false);
    }
};

/**
 * Multer upload middleware for profile pictures and cover photos
 */
export const uploadProfileImage = multer({
    storage: profileStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
});

/**
 * Multer upload middleware for post images
 */
export const uploadPostImage = multer({
    storage: postStorage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
    },
});

/**
 * Error handling middleware for multer errors
 */
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                error: "File too large",
                message: "Image size must be less than 5MB",
            });
        }
        return res.status(400).json({
            error: "Upload error",
            message: err.message,
        });
    } else if (err) {
        return res.status(400).json({
            error: "Upload error",
            message: err.message,
        });
    }
    next();
};
