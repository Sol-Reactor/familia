import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import { signToken, publicUserSelect } from "../utils/token.js";

const SALT_ROUNDS = 12;

// Pre-computed hash used to keep login timing identical whether or not the
// email exists (prevents user enumeration via response time).
const DUMMY_HASH = bcrypt.hashSync("familia-timing-equaliser", SALT_ROUNDS);

const INVALID_CREDENTIALS = "Invalid email or password";

const findUserByEmail = (email) =>
    prisma.user.findFirst({
        // Case-insensitive so accounts created before email normalisation still work
        where: { email: { equals: email, mode: "insensitive" } },
    });

const toPublicUser = (user) => {
    const { password: _password, ...rest } = user;
    return rest;
};

export const register = async (req, res, next) => {
    try {
        const { name, email, password, bio } = req.body;

        const existing = await findUserByEmail(email);
        if (existing) {
            return res.status(409).json({ error: "An account with this email already exists" });
        }

        const hashed = await bcrypt.hash(password, SALT_ROUNDS);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
                ...(bio ? { bio } : {}),
            },
        });

        res.status(201).json({ user: toPublicUser(user), token: signToken(user) });
    } catch (err) {
        next(err);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await findUserByEmail(email);

        // Always run bcrypt so the response time doesn't reveal whether the email exists
        const valid = await bcrypt.compare(password, user?.password ?? DUMMY_HASH);

        if (!user || !valid) {
            return res.status(401).json({ error: INVALID_CREDENTIALS });
        }

        res.json({ user: toPublicUser(user), token: signToken(user) });
    } catch (err) {
        next(err);
    }
};

// Returns the currently authenticated user - used by the client to validate a stored session
export const me = async (req, res, next) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: publicUserSelect,
        });
        if (!user) return res.status(401).json({ error: "Session is no longer valid" });
        res.json({ user });
    } catch (err) {
        next(err);
    }
};

// JWTs are stateless; the client discards its token. Endpoint exists for API symmetry.
export const logout = (req, res) => {
    res.json({ message: "Logged out" });
};
