import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const ratingsRouter = Router();

ratingsRouter.use(authenticate);

// POST /api/ratings — customer rates delivery + products after delivery
ratingsRouter.post("/", async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      orderId: z.string(),
      deliveryRating: z.number().int().min(1).max(5).optional(),
      deliveryComment: z.string().optional(),
      productRatings: z.array(z.object({
        productId: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
      })).optional(),
    });

    const { orderId, deliveryRating, deliveryComment, productRatings } = schema.parse(req.body);

    const order = await prisma.order.findFirst({
      where: { id: orderId, userId: req.user!.userId, status: "DELIVERED" },
      include: { deliveryRating: true },
    });
    if (!order) throw new AppError("Order not found or not delivered yet", 404);
    if (order.deliveryRating) throw new AppError("Order already rated", 400);

    await prisma.$transaction(async (tx) => {
      // Save delivery rating
      if (deliveryRating && order.deliveryPartnerId) {
        await tx.deliveryRating.create({
          data: {
            orderId,
            deliveryPartnerId: order.deliveryPartnerId!,
            userId: req.user!.userId,
            rating: deliveryRating,
            comment: deliveryComment,
          },
        });

        // Recalculate average delivery partner rating
        const allRatings = await tx.deliveryRating.findMany({
          where: { deliveryPartnerId: order.deliveryPartnerId! },
          select: { rating: true },
        });
        const avgRating = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;

        await tx.deliveryPartner.update({
          where: { id: order.deliveryPartnerId! },
          data: { rating: Math.round(avgRating * 10) / 10 },
        });
      }

      // Save product ratings
      if (productRatings && productRatings.length > 0) {
        for (const pr of productRatings) {
          await tx.review.upsert({
            where: { userId_productId: { userId: req.user!.userId, productId: pr.productId } },
            create: {
              userId: req.user!.userId,
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
  } catch (err) {
    next(err);
  }
});

// GET /api/ratings/order/:orderId — check if order already rated
ratingsRouter.get("/order/:orderId", async (req: AuthRequest, res, next) => {
  try {
    const rating = await prisma.deliveryRating.findUnique({
      where: { orderId: req.params.orderId },
    });
    res.json({ rated: !!rating, rating });
  } catch (err) {
    next(err);
  }
});
