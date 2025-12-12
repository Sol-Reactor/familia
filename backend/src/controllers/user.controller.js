import prisma from "../prisma.js";
import bcrypt from "bcrypt";

// Get all users (with optional search)
export const getUsers = async (req, res) => {
    try {
        const { search } = req.query;

        const users = await prisma.user.findMany({
            where: search ? {
                OR: [
                    { name: { contains: search, mode: 'insensitive' } },
                    { username: { contains: search, mode: 'insensitive' } },
                    { email: { contains: search, mode: 'insensitive' } }
                ]
            } : {},
            select: {
                id: true,
                name: true,
                username: true,
                avatarUrl: true,
                bio: true,
                location: true,
                website: true,
                createdAt: true
            }
        });

        res.json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get current user profile
export const getMyProfile = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                bio: true,
                location: true,
                website: true,
                avatarUrl: true,
                coverUrl: true,
                createdAt: true
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get user by ID
export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                name: true,
                username: true,
                bio: true,
                location: true,
                website: true,
                avatarUrl: true,
                coverUrl: true,
                createdAt: true,
                _count: {
                    select: {
                        posts: true,
                        friendships1: true,
                        friendships2: true
                    }
                }
            }
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update current user profile
export const updateMyProfile = async (req, res) => {
    try {
        const { name, username, bio, location, website, avatarUrl, coverUrl } = req.body;

        // Get uploaded images from Cloudinary (if any) - Backend upload
        const profilePictureFile = req.files?.profilePicture?.[0]?.path;
        const coverPhotoFile = req.files?.coverPhoto?.[0]?.path;

        // Check if username is already taken by another user
        if (username) {
            const existingUser = await prisma.user.findUnique({
                where: { username }
            });

            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(400).json({ error: "Username already taken" });
            }
        }

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(username && { username }),
                ...(bio !== undefined && { bio }),
                ...(location !== undefined && { location }),
                ...(website !== undefined && { website }),
                // Use file upload if present, otherwise use URL from body
                ...((profilePictureFile || avatarUrl) && { avatarUrl: profilePictureFile || avatarUrl }),
                ...((coverPhotoFile || coverUrl) && { coverUrl: coverPhotoFile || coverUrl })
            },
            select: {
                id: true,
                name: true,
                email: true,
                username: true,
                bio: true,
                location: true,
                website: true,
                avatarUrl: true,
                coverUrl: true,
                createdAt: true
            }
        });

        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update password
export const updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        // Get user with password
        const user = await prisma.user.findUnique({
            where: { id: req.user.id }
        });

        // Verify current password
        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword }
        });

        res.json({ message: "Password updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete user account
export const deleteMyAccount = async (req, res) => {
    try {
        await prisma.user.delete({
            where: { id: req.user.id }
        });

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
