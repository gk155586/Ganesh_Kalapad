import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const couponRouter = Router();

// GET /api/coupons - public active coupons
couponRouter.get("/", async (_req, res, next) => {
  try {
    const coupons = await prisma.coupon.findMany({
      where: {
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      select: {
        id: true, code: true, type: true, value: true,
        minOrderAmount: true, maxDiscount: true, expiresAt: true,
      },
    });
    res.json(coupons);
  } catch (err) {
    next(err);
  }
});

// POST /api/coupons/validate
couponRouter.post("/validate", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { code, orderAmount } = z.object({
      code: z.string(),
      orderAmount: z.number().positive(),
    }).parse(req.body);

    const coupon = await prisma.coupon.findFirst({
      where: {
        code: code.toUpperCase(),
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    if (!coupon) throw new AppError("Invalid or expired coupon", 400);
    if (orderAmount < coupon.minOrderAmount) {
      throw new AppError(`Minimum order amount is ₹${coupon.minOrderAmount}`, 400);
    }
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError("Coupon usage limit reached", 400);
    }

    const used = await prisma.couponUsage.findUnique({
      where: { couponId_userId: { couponId: coupon.id, userId: req.user!.userId } },
    });
    if (used) throw new AppError("Coupon already used", 400);

    const discount = coupon.type === "PERCENTAGE"
      ? Math.min((orderAmount * coupon.value) / 100, coupon.maxDiscount || Infinity)
      : coupon.value;

    res.json({ valid: true, discount, coupon });
  } catch (err) {
    next(err);
  }
});
