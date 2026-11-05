import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import { signToken, publicUserSelect } from "../utils/token.js";
import { toInt } from "../utils/query.js";

// Fields safe to show to OTHER users (no email)
const otherUserSelect = {
    id: true,
    name: true,
    username: true,
    avatarUrl: true,
    bio: true,
    location: true,
    website: true,
    createdAt: true,
};

// Search users by name/username (email is intentionally NOT searchable - privacy)
export const getUsers = async (req, res, next) => {
    try {
        const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
        const limit = toInt(req.query.limit, 20, { min: 1, max: 50 });

        const users = await prisma.user.findMany({
            where: search
                ? {
                    OR: [
                        { name: { contains: search, mode: "insensitive" } },
                        { username: { contains: search, mode: "insensitive" } },
                    ],
                }
                : {},
            take: limit,
            orderBy: { name: "asc" },
            select: otherUserSelect,
        });

        res.json(users);
    } catch (err) {
        next(err);
    }
};

// Get current user profile
export const getMyProfile = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: publicUserSelect,
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json(user);
    } catch (err) {
        next(err);
    }
};

// Get user by ID
export const getUserById = async (req, res, next) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                ...otherUserSelect,
                coverUrl: true,
                _count: { select: { posts: true } },
            },
        });

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Count only ACCEPTED friendships (pending requests are not friends)
        const friendsCount = await prisma.friendship.count({
            where: {
                status: "accepted",
                OR: [{ requesterId: id }, { addresseeId: id }],
            },
        });

        res.json({ ...user, friendsCount });
    } catch (err) {
        next(err);
    }
};

// Update current user profile
export const updateMyProfile = async (req, res, next) => {
    try {
        const { name, username, bio, location, website, avatarUrl, coverUrl } = req.body;

        // Images uploaded through multer -> Cloudinary
        const profilePictureFile = req.files?.profilePicture?.[0]?.path;
        const coverPhotoFile = req.files?.coverPhoto?.[0]?.path;

        if (username) {
            const existingUser = await prisma.user.findFirst({
                where: { username: { equals: username, mode: "insensitive" } },
                select: { id: true },
            });

            if (existingUser && existingUser.id !== req.user.id) {
                return res.status(409).json({ error: "Username already taken" });
            }
        }

        const nextAvatar = profilePictureFile || avatarUrl;
        const nextCover = coverPhotoFile || coverUrl;

        const updatedUser = await prisma.user.update({
            where: { id: req.user.id },
            data: {
                ...(name && { name }),
                ...(username !== undefined && { username: username || null }),
                ...(bio !== undefined && { bio: bio || null }),
                ...(location !== undefined && { location: location || null }),
                ...(website !== undefined && { website: website || null }),
                ...(nextAvatar && { avatarUrl: nextAvatar }),
                ...(nextCover && { coverUrl: nextCover }),
            },
            select: publicUserSelect,
        });

        res.json(updatedUser);
    } catch (err) {
        next(err);
    }
};

// Update password - returns a fresh token; all previously issued tokens stop working
export const updatePassword = async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(400).json({ error: "Current password is incorrect" });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 12);

        const updated = await prisma.user.update({
            where: { id: req.user.id },
            data: { password: hashedPassword },
        });

        res.json({ message: "Password updated successfully", token: signToken(updated) });
    } catch (err) {
        next(err);
    }
};

// Delete user account (requires password confirmation)
export const deleteMyAccount = async (req, res, next) => {
    try {
        const { password } = req.body;

        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(400).json({ error: "Password is incorrect" });
        }

        await prisma.user.delete({ where: { id: req.user.id } });

        res.json({ message: "Account deleted successfully" });
    } catch (err) {
        next(err);
    }
};
