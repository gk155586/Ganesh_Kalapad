import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const authRouter = Router();

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || "https://freshin10-api.onrender.com/api/auth/google/callback";
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL || "https://fresh-in10-web.vercel.app";

// GET /api/auth/google - Initiate Google OAuth
authRouter.get("/google", (req, res) => {
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
authRouter.get("/google/callback", async (req, res, next) => {
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

    interface GoogleTokenResponse {
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token?: string;
    }

    const tokens = (await tokenResponse.json()) as GoogleTokenResponse;

    if (!tokens.access_token) {
      return res.redirect(`${FRONTEND_URL}/auth/login?error=token_exchange_failed`);
    }

    // Get user info from Google
    const userInfoResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });

    interface GoogleUserInfo {
      id: string;
      email: string;
      name: string;
      picture: string;
    }

    const googleUser = (await userInfoResponse.json()) as GoogleUserInfo;

    if (!googleUser.email) {
      return res.redirect(`${FRONTEND_URL}/auth/login?error=no_email`);
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { email: googleUser.email },
      select: { 
        id: true, name: true, email: true, phone: true, 
        role: true, avatar: true, isActive: true, googleId: true 
      },
    });

    if (user) {
      // Update existing user with Google ID if not set
      if (!user.googleId) {
        user = await prisma.user.update({
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
    } else {
      // Create new user
      user = await prisma.user.create({
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
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken },
    });

    // Redirect to frontend with tokens
    const redirectUrl = new URL(`${FRONTEND_URL}/auth/callback`);
    redirectUrl.searchParams.append("accessToken", accessToken);
    redirectUrl.searchParams.append("refreshToken", refreshToken);

    res.redirect(redirectUrl.toString());
  } catch (err) {
    console.error("Google OAuth error:", err);
    res.redirect(`${FRONTEND_URL}/auth/login?error=oauth_failed`);
  }
});

// POST /api/auth/register
authRouter.post("/register", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
    });

    const data = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError("Email already registered", 409);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        cart: { create: {} }, // auto-create cart
      },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true },
    });

    const accessToken = signAccessToken({ userId: user.id, email: user.email, role: user.role });
    const refreshToken = signRefreshToken({ userId: user.id, email: user.email, role: user.role });

    res.status(201).json({ user, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });

    const { email, password } = schema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, name: true, email: true, phone: true, role: true, avatar: true, password: true, isActive: true },
    });

    if (!user || !user.password) throw new AppError("Invalid credentials", 401);
    if (!user.isActive) throw new AppError("Account is deactivated", 403);

    // Delivery Partner Approval Check
    if (user.role === "DELIVERY" || user.role === "DELIVERY_PARTNER") {
      const partner = await prisma.deliveryPartner.findUnique({ where: { userId: user.id } });
      if (partner && !partner.isVerified) {
        throw new AppError("Your profile is pending approval from admin. Please wait for verification.", 403);
      }
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError("Invalid credentials", 401);

    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, accessToken, refreshToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/refresh
authRouter.post("/refresh", async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError("Refresh token required", 400);

    const payload = verifyRefreshToken(refreshToken);

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, isActive: true },
    });

    if (!user || !user.isActive) {
      throw new AppError("Invalid refresh token", 401);
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = signAccessToken(newPayload);
    const newRefreshToken = signRefreshToken(newPayload);

    res.json({ accessToken, refreshToken: newRefreshToken });
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/logout
authRouter.post("/logout", authenticate, async (req: AuthRequest, res, next) => {
  try {
    res.json({ message: "Logged out successfully" });
  } catch (err) {
    next(err);
  }
});

// GET /api/auth/me
authRouter.get("/me", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true, name: true, email: true, phone: true,
        role: true, avatar: true, walletBalance: true,
        isVerified: true, createdAt: true,
      },
    });
    if (!user) throw new AppError("User not found", 404);
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /api/auth/send-otp
authRouter.post("/send-otp", async (req, res, next) => {
  try {
    const { phone } = z.object({ phone: z.string().regex(/^[6-9]\d{9}$/) }).parse(req.body);

    // In production: use Twilio to send OTP
    // For demo: return a fixed OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store OTP in cache/DB with expiry (simplified)
    await prisma.user.upsert({
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
  } catch (err) {
    next(err);
  }
});
