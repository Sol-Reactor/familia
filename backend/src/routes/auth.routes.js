import { Router } from "express";
import { register, login, me, logout } from "../controllers/auth.controller.js";
import { validateRequest } from "../middleware/validation.js";
import { authenticate } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { registerSchema, loginSchema } from "../validations/auth.validation.js";

const router = Router();

// Brute-force protection: 10 login attempts / 15 min, 10 sign-ups / hour per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: "Too many login attempts. Please wait 15 minutes and try again.",
});
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: "Too many accounts created from this network. Please try again later.",
});

router.post("/register", registerLimiter, validateRequest(registerSchema), register);
router.post("/login", loginLimiter, validateRequest(loginSchema), login);
router.get("/me", authenticate, me);
router.post("/logout", authenticate, logout);

export default router;
