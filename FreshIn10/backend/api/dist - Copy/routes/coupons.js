"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.couponRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
exports.couponRouter = (0, express_1.Router)();
// GET /api/coupons - public active coupons
exports.couponRouter.get("/", async (_req, res, next) => {
    try {
        const coupons = await prisma_1.prisma.coupon.findMany({
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
    }
    catch (err) {
        next(err);
    }
});
// POST /api/coupons/validate
exports.couponRouter.post("/validate", auth_1.authenticate, async (req, res, next) => {
    try {
        const { code, orderAmount } = zod_1.z.object({
            code: zod_1.z.string(),
            orderAmount: zod_1.z.number().positive(),
        }).parse(req.body);
        const coupon = await prisma_1.prisma.coupon.findFirst({
            where: {
                code: code.toUpperCase(),
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
        });
        if (!coupon)
            throw new errorHandler_1.AppError("Invalid or expired coupon", 400);
        if (orderAmount < coupon.minOrderAmount) {
            throw new errorHandler_1.AppError(`Minimum order amount is ₹${coupon.minOrderAmount}`, 400);
        }
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            throw new errorHandler_1.AppError("Coupon usage limit reached", 400);
        }
        const used = await prisma_1.prisma.couponUsage.findUnique({
            where: { couponId_userId: { couponId: coupon.id, userId: req.user.userId } },
        });
        if (used)
            throw new errorHandler_1.AppError("Coupon already used", 400);
        const discount = coupon.type === "PERCENTAGE"
            ? Math.min((orderAmount * coupon.value) / 100, coupon.maxDiscount || Infinity)
            : coupon.value;
        res.json({ valid: true, discount, coupon });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=coupons.js.map