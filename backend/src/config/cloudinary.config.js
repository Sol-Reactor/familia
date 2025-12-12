import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configure Cloudinary with credentials from environment variables
 */
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration on startup
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    console.warn("⚠️  WARNING: Cloudinary credentials are not set in .env file");
}

export default cloudinary;
