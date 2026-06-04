import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { formatProduct } from "./products";

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const wishlist = await prisma.wishlist.findMany({
      where: { userId: req.user!.userId },
      include: {
        product: {
          include: { inventory: { select: { stock: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(wishlist.map(item => ({
      ...item,
      product: formatProduct(item.product)
    })));
  } catch (err) {
    next(err);
  }
});

wishlistRouter.post("/toggle", async (req: AuthRequest, res, next) => {
  try {
    const { productId } = z.object({ productId: z.string() }).parse(req.body);

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId: req.user!.userId, productId } },
    });

    if (existing) {
      await prisma.wishlist.delete({ where: { id: existing.id } });
      return res.json({ wishlisted: false });
    }

    await prisma.wishlist.create({
      data: { userId: req.user!.userId, productId },
    });

    res.json({ wishlisted: true });
  } catch (err) {
    next(err);
  }
});
