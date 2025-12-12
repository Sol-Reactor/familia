import prisma from "../prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        const hashed = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashed,
            },
        });

        // Generate token
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({ user: userWithoutPassword, token });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) return res.status(400).json({ error: "User not found" });

        const valid = await bcrypt.compare(password, user.password);

        if (!valid) return res.status(400).json({ error: "Invalid password" });

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
            expiresIn: "7d",
        });

        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;

        res.json({ user: userWithoutPassword, token });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
};
