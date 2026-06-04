"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingsRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
exports.ratingsRouter = (0, express_1.Router)();
exports.ratingsRouter.use(auth_1.authenticate);
// POST /api/ratings — customer rates delivery + products after delivery
exports.ratingsRouter.post("/", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            orderId: zod_1.z.string(),
            deliveryRating: zod_1.z.number().int().min(1).max(5).optional(),
            deliveryComment: zod_1.z.string().optional(),
            productRatings: zod_1.z.array(zod_1.z.object({
                productId: zod_1.z.string(),
                rating: zod_1.z.number().int().min(1).max(5),
                comment: zod_1.z.string().optional(),
            })).optional(),
        });
        const { orderId, deliveryRating, deliveryComment, productRatings } = schema.parse(req.body);
        const order = await prisma_1.prisma.order.findFirst({
            where: { id: orderId, userId: req.user.userId, status: "DELIVERED" },
            include: { deliveryRating: true },
        });
        if (!order)
            throw new errorHandler_1.AppError("Order not found or not delivered yet", 404);
        if (order.deliveryRating)
            throw new errorHandler_1.AppError("Order already rated", 400);
        await prisma_1.prisma.$transaction(async (tx) => {
            // Save delivery rating
            if (deliveryRating && order.deliveryPartnerId) {
                await tx.deliveryRating.create({
                    data: {
                        orderId,
                        deliveryPartnerId: order.deliveryPartnerId,
                        userId: req.user.userId,
                        rating: deliveryRating,
                        comment: deliveryComment,
                    },
                });
                // Recalculate average delivery partner rating
                const allRatings = await tx.deliveryRating.findMany({
                    where: { deliveryPartnerId: order.deliveryPartnerId },
                    select: { rating: true },
                });
                const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
                await tx.deliveryPartner.update({
                    where: { id: order.deliveryPartnerId },
                    data: { rating: Math.round(avgRating * 10) / 10 },
                });
            }
            // Save product ratings
            if (productRatings && productRatings.length > 0) {
                for (const pr of productRatings) {
                    await tx.review.upsert({
                        where: { userId_productId: { userId: req.user.userId, productId: pr.productId } },
                        create: {
                            userId: req.user.userId,
                            productId: pr.productId,
                            rating: pr.rating,
                            comment: pr.comment,
                        },
                        update: { rating: pr.rating, comment: pr.comment },
                    });
                    // Recalculate product average rating
                    const reviews = await tx.review.findMany({
                        where: { productId: pr.productId, isActive: true },
                        select: { rating: true },
                    });
                    const avgProductRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                    await tx.product.update({
                        where: { id: pr.productId },
                        data: { rating: Math.round(avgProductRating * 10) / 10, reviewCount: reviews.length },
                    });
                }
            }
        });
        res.json({ message: "Thank you for your rating!" });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/ratings/order/:orderId — check if order already rated
exports.ratingsRouter.get("/order/:orderId", async (req, res, next) => {
    try {
        const rating = await prisma_1.prisma.deliveryRating.findUnique({
            where: { orderId: req.params.orderId },
        });
        res.json({ rated: !!rating, rating });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=ratings.js.map