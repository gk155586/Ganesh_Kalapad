"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
const express_1 = require("express");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const jwt_1 = require("../lib/jwt");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
exports.authRouter = (0, express_1.Router)();
// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || `${process.env.API_URL || 'http://localhost:3003'}/api/auth/google/callback`;
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
// GET /api/auth/google - Initiate Google OAuth
exports.authRouter.get("/google", (req, res) => {
    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({
            error: "Google OAuth not configured. Please add GOOGLE_CLIENT_ID to .env file."
        });
    }
    const googleAuthUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleAuthUrl.searchParams.append("client_id", GOOGLE_CLIENT_ID);
    googleAuthUrl.searchParams.append("redirect_uri", GOOGLE_REDIRECT_URI);
    googleAuthUrl.searchParams.append("response_type", "code");
    googleAuthUrl.searchParams.append("scope", "openid email profile");
    googleAuthUrl.searchParams.append("access_type", "offline");
    googleAuthUrl.searchParams.append("prompt", "consent");
    res.redirect(googleAuthUrl.toString());
});
// GET /api/auth/google/callback - Handle Google OAuth callback
exports.authRouter.get("/google/callback", async (req, res, next) => {
    try {
        const { code } = req.query;
        if (!code) {
            return res.redirect(`${FRONTEND_URL}/auth/login?error=no_code`);
        }
        if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_not_configured`);
        }
        // Exchange code for tokens
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                code,
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                redirect_uri: GOOGLE_REDIRECT_URI,
                grant_type: "authorization_code",
            }),
        });
        const tokens = (await tokenResponse.json());
        if (!tokens.access_token) {
            return res.redirect(`${FRONTEND_URL}/auth/login?error=token_exchange_failed`);
        }
        // Get user info from Google
        const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
            headers: { Authorization: `Bearer ${tokens.access_token}` },
        });
        const googleUser = (await userInfoResponse.json());
        if (!googleUser.email) {
            return res.redirect(`${FRONTEND_URL}/auth/login?error=no_email`);
        }
        // Find or create user
        let user = await prisma_1.prisma.user.findUnique({
            where: { email: googleUser.email },
            select: {
                id: true, name: true, email: true, phone: true,
                role: true, avatar: true, isActive: true, googleId: true
            },
        });
        if (user) {
            // Update existing user with Google ID if not set
            if (!user.googleId) {
                user = await prisma_1.prisma.user.update({
                    where: { id: user.id },
                    data: { googleId: googleUser.id, avatar: googleUser.picture },
                    select: {
                        id: true, name: true, email: true, phone: true,
                        role: true, avatar: true, isActive: true, googleId: true
                    },
                });
            }
            if (!user.isActive) {
                return res.redirect(`${FRONTEND_URL}/auth/login?error=account_deactivated`);
            }
        }
        else {
            // Create new user
            user = await prisma_1.prisma.user.create({
                data: {
                    name: googleUser.name || googleUser.email.split("@")[0],
                    email: googleUser.email,
                    avatar: googleUser.picture,
                    googleId: googleUser.id,
                    isVerified: true,
                    cart: { create: {} },
                },
                select: {
                    id: true, name: true, email: true, phone: true,
                    role: true, avatar: true, isActive: true, googleId: true
                },
            });
        }
        // Generate JWT tokens
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.signAccessToken)(payload);
        const refreshToken = (0, jwt_1.signRefreshToken)(payload);
        await prisma_1.prisma.user.update({
            where: { id: user.id },
            data: { refreshToken },
        });
        // Redirect to frontend with tokens
        const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
        redirectUrl.searchParams.append("accessToken", accessToken);
        redirectUrl.searchParams.append("refreshToken", refreshToken);
        res.redirect(redirectUrl.toString());
    }
    catch (err) {
        console.error("Google OAuth error:", err);
        res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`);
    }
});
// POST /api/auth/register
exports.authRouter.post("/register", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2),
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(8),
            phone: zod_1.z.string().regex(/^[6-9]\d{9}$/).optional(),
        });
        const data = schema.parse(req.body);
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw new errorHandler_1.AppError("Email already registered", 409);
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                phone: data.phone,
                cart: { create: {} }, // auto-create cart
            },
            select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
        });
        const accessToken = (0, jwt_1.signAccessToken)({ userId: user.id, email: user.email, role: user.role });
        const refreshToken = (0, jwt_1.signRefreshToken)({ userId: user.id, email: user.email, role: user.role });
        await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
        res.status(201).json({ user, accessToken, refreshToken });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/login
exports.authRouter.post("/login", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(1),
        });
        const { email, password } = schema.parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { email },
            select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, password: true, isActive: true },
        });
        if (!user || !user.password)
            throw new errorHandler_1.AppError("Invalid credentials", 401);
        if (!user.isActive)
            throw new errorHandler_1.AppError("Account is deactivated", 403);
        // Delivery Partner Approval Check
        if (user.role === "DELIVERY") {
            const partner = await prisma_1.prisma.deliveryPartner.findUnique({ where: { userId: user.id } });
            if (partner && !partner.isVerified) {
                throw new errorHandler_1.AppError("Your profile is pending approval from admin. Please wait for verification.", 403);
            }
        }
        const valid = await bcryptjs_1.default.compare(password, user.password);
        if (!valid)
            throw new errorHandler_1.AppError("Invalid credentials", 401);
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.signAccessToken)(payload);
        const refreshToken = (0, jwt_1.signRefreshToken)(payload);
        await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
        const { password: _, ...userWithoutPassword } = user;
        res.json({ user: userWithoutPassword, accessToken, refreshToken });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/refresh
exports.authRouter.post("/refresh", async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken)
            throw new errorHandler_1.AppError("Refresh token required", 400);
        const payload = (0, jwt_1.verifyRefreshToken)(refreshToken);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, email: true, role: true, refreshToken: true, isActive: true },
        });
        if (!user || user.refreshToken !== refreshToken || !user.isActive) {
            throw new errorHandler_1.AppError("Invalid refresh token", 401);
        }
        const newPayload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, jwt_1.signAccessToken)(newPayload);
        const newRefreshToken = (0, jwt_1.signRefreshToken)(newPayload);
        await prisma_1.prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });
        res.json({ accessToken, refreshToken: newRefreshToken });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/logout
exports.authRouter.post("/logout", auth_1.authenticate, async (req, res, next) => {
    try {
        await prisma_1.prisma.user.update({
            where: { id: req.user.userId },
            data: { refreshToken: null },
        });
        res.json({ message: "Logged out successfully" });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/auth/me
exports.authRouter.get("/me", auth_1.authenticate, async (req, res, next) => {
    try {
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: {
                id: true, name: true, email: true, phone: true,
                role: true, avatar: true, walletBalance: true,
                isVerified: true, createdAt: true,
            },
        });
        if (!user)
            throw new errorHandler_1.AppError("User not found", 404);
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/auth/send-otp
exports.authRouter.post("/send-otp", async (req, res, next) => {
    try {
        const { phone } = zod_1.z.object({ phone: zod_1.z.string().regex(/^[6-9]\d{9}$/) }).parse(req.body);
        // In production: use Twilio to send OTP
        // For demo: return a fixed OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        // Store OTP in cache/DB with expiry (simplified)
        await prisma_1.prisma.user.upsert({
            where: { phone },
            update: {},
            create: {
                name: "User",
                email: `${phone}@temp.freshin10.com`,
                phone,
                cart: { create: {} },
            },
        });
        console.log(`OTP for ${phone}: ${otp}`); // In prod, send via Twilio
        res.json({ message: "OTP sent successfully", ...(process.env.NODE_ENV !== "production" && { otp }) });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=auth.js.map