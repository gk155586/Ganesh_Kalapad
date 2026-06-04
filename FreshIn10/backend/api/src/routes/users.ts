import { Router } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const userRouter = Router();

userRouter.use(authenticate);

// GET /api/users/profile
userRouter.get("/profile", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, name: true, email: true, phone: true, avatar: true, walletBalance: true, role: true, createdAt: true, isActive: true },
    });
    if (!user) throw new AppError("User not found", 404);

    const mainAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true } });
    
    res.json({
      ...user,
      isMainAdmin: user.id === mainAdmin?.id
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/profile
userRouter.put("/profile", async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2).optional(),
      email: z.string().email().optional(),
      phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
      avatar: z.string().url().optional(),
    });

    const data = schema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user!.userId },
      data,
      select: { id: true, name: true, email: true, phone: true, avatar: true, walletBalance: true, role: true, createdAt: true, isActive: true },
    });

    const mainAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" }, select: { id: true } });

    res.json({
      ...user,
      isMainAdmin: user.id === mainAdmin?.id
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/change-password
userRouter.put("/change-password", async (req: AuthRequest, res, next) => {
  try {
    const { currentPassword, newPassword } = z.object({
      currentPassword: z.string(),
      newPassword: z.string().min(8),
    }).parse(req.body);

    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { password: true },
    });

    if (!user?.password) throw new AppError("No password set", 400);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError("Current password is incorrect", 400);

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user!.userId },
      data: { password: hashed },
    });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/addresses
userRouter.get("/addresses", async (req: AuthRequest, res, next) => {
  try {
    const addresses = await prisma.address.findMany({
      where: { userId: req.user!.userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
    });
    res.json(addresses);
  } catch (err) {
    next(err);
  }
});

// POST /api/users/addresses
userRouter.post("/addresses", async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      label: z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
      fullName: z.string().min(2),
      phone: z.string().regex(/^[6-9]\d{9}$/),
      addressLine1: z.string().min(5),
      addressLine2: z.string().optional(),
      city: z.string().min(2),
      state: z.string().min(2),
      pincode: z.string().regex(/^\d{6}$/),
      landmark: z.string().optional(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      isDefault: z.boolean().default(false),
    });

    const data = schema.parse(req.body);

    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: { ...data, userId: req.user!.userId, label: data.label as any } as any,
    });

    res.status(201).json(address);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/addresses/:id
userRouter.put("/addresses/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) throw new AppError("Address not found", 404);

    const data = req.body;
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId: req.user!.userId },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.update({
      where: { id: req.params.id },
      data,
    });

    res.json(address);
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/addresses/:id
userRouter.delete("/addresses/:id", async (req: AuthRequest, res, next) => {
  try {
    const existing = await prisma.address.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
    });
    if (!existing) throw new AppError("Address not found", 404);

    await prisma.address.delete({ where: { id: req.params.id } });
    res.json({ message: "Address deleted" });
  } catch (err) {
    next(err);
  }
});

// GET /api/users/notifications
userRouter.get("/notifications", async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    res.json(notifications);
  } catch (err) {
    next(err);
  }
});

// PUT /api/users/notifications/:id/read
userRouter.put("/notifications/:id/read", async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.update({
      where: { id: req.params.id },
      data: { isRead: true },
    });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
});
