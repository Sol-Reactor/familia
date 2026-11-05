import axios from 'axios';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_URL = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

/** Returns an error message, or null if the file is acceptable */
export const validateImageFile = (file) => {
    if (!file) return 'No file selected';
    if (!ALLOWED_TYPES.includes(file.type)) return 'Please choose a JPG, PNG, GIF or WebP image';
    if (file.size > MAX_IMAGE_BYTES) return 'Image must be smaller than 5 MB';
    return null;
};

export const uploadToCloudinary = async (file, onProgress) => {
    if (!CLOUD_NAME || !UPLOAD_PRESET) {
        throw new Error('Image uploads are not configured (missing Cloudinary settings).');
    }

    const problem = validateImageFile(file);
    if (problem) throw new Error(problem);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
        const response = await axios.post(CLOUDINARY_URL, formData, {
            onUploadProgress: (progressEvent) => {
                if (onProgress && progressEvent.total) {
                    onProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
                }
            },
        });

        return {
            url: response.data.secure_url,
            publicId: response.data.public_id,
        };
    } catch (error) {
        if (import.meta.env.DEV) console.error('Cloudinary upload error:', error);
        throw new Error('Failed to upload image. Please try again.');
    }
};
