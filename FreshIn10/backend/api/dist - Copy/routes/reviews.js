"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviewRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
exports.reviewRouter = (0, express_1.Router)();
exports.reviewRouter.post("/", auth_1.authenticate, async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            productId: zod_1.z.string(),
            rating: zod_1.z.number().min(1).max(5),
            comment: zod_1.z.string().optional(),
            images: zod_1.z.array(zod_1.z.string().url()).optional(),
        });
        const data = schema.parse(req.body);
        // Verify user purchased the product
        const purchased = await prisma_1.prisma.orderItem.findFirst({
            where: {
                productId: data.productId,
                order: { userId: req.user.userId, status: "DELIVERED" },
            },
        });
        if (!purchased)
            throw new errorHandler_1.AppError("You can only review products you've purchased", 403);
        const { images, ...rest } = data;
        const review = await prisma_1.prisma.review.upsert({
            where: { userId_productId: { userId: req.user.userId, productId: data.productId } },
            update: {
                rating: data.rating,
                comment: data.comment,
                images: images ? JSON.stringify(images) : undefined,
            },
            create: {
                ...rest,
                userId: req.user.userId,
                images: images ? JSON.stringify(images) : undefined,
            },
            include: { user: { select: { name: true, avatar: true } } },
        });
        // Update product rating
        const stats = await prisma_1.prisma.review.aggregate({
            where: { productId: data.productId, isActive: true },
            _avg: { rating: true },
            _count: true,
        });
        await prisma_1.prisma.product.update({
            where: { id: data.productId },
            data: {
                rating: stats._avg.rating || 0,
                reviewCount: stats._count,
            },
        });
        res.status(201).json(review);
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=reviews.js.map