import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";

export const reviewRouter = Router();

reviewRouter.post("/", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      productId: z.string(),
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
      images: z.array(z.string().url()).optional(),
    });

    const data = schema.parse(req.body);

    // Verify user purchased the product
    const purchased = await prisma.orderItem.findFirst({
      where: {
        productId: data.productId,
        order: { userId: req.user!.userId, status: "DELIVERED" },
      },
    });

    if (!purchased) throw new AppError("You can only review products you've purchased", 403);

    const { images, ...rest } = data;

    const review = await prisma.review.upsert({
      where: { userId_productId: { userId: req.user!.userId, productId: data.productId } },
      update: { 
        rating: data.rating, 
        comment: data.comment,
        images: images ? JSON.stringify(images) : undefined,
      },
      create: { 
        ...rest, 
        userId: req.user!.userId,
        images: images ? JSON.stringify(images) : undefined,
      } as any,
      include: { user: { select: { name: true, avatar: true } } },
    });

    // Update product rating
    const stats = await prisma.review.aggregate({
      where: { productId: data.productId, isActive: true },
      _avg: { rating: true },
      _count: true,
    });

    await prisma.product.update({
      where: { id: data.productId },
      data: {
        rating: stats._avg.rating || 0,
        reviewCount: stats._count,
      },
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});
