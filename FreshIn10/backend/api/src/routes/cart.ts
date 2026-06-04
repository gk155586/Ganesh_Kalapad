import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { formatProduct } from "./products";

export const cartRouter = Router();

cartRouter.use(authenticate);

// GET /api/cart
cartRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({
      where: { userId: req.user!.userId },
      include: {
        items: {
          include: {
            product: {
              include: { inventory: { select: { stock: true } } },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!cart) {
      // Create cart if doesn't exist
      const newCart = await prisma.cart.create({
        data: { userId: req.user!.userId },
        include: { items: true },
      });
      return res.json({ ...newCart, summary: { subtotal: 0, itemCount: 0 } });
    }

    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );
    const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

    const formattedCart = {
      ...cart,
      items: cart.items.map(item => ({
        ...item,
        product: formatProduct(item.product)
      })),
      summary: { subtotal, itemCount }
    };

    res.json(formattedCart);
  } catch (err) {
    next(err);
  }
});

// POST /api/cart/add
cartRouter.post("/add", async (req: AuthRequest, res, next) => {
  try {
    const { productId, quantity } = z.object({
      productId: z.string(),
      quantity: z.number().int().positive().default(1),
    }).parse(req.body);

    // Verify product exists and has stock
    const product = await prisma.product.findUnique({
      where: { id: productId, isActive: true },
      include: { inventory: true },
    });

    if (!product) throw new AppError("Product not found", 404);
    if (!product.inventory || product.inventory.stock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    let cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user!.userId } });
    }

    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    let item;
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (product.inventory.stock < newQty) throw new AppError("Insufficient stock", 400);
      item = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: { product: true },
      });
    } else {
      item = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
        include: { product: true },
      });
    }

    res.json({
      ...item,
      product: formatProduct(item?.product)
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/cart/update
cartRouter.put("/update", async (req: AuthRequest, res, next) => {
  try {
    const { productId, quantity } = z.object({
      productId: z.string(),
      quantity: z.number().int().min(0),
    }).parse(req.body);

    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (!cart) throw new AppError("Cart not found", 404);

    if (quantity === 0) {
      await prisma.cartItem.deleteMany({
        where: { cartId: cart.id, productId },
      });
      return res.json({ message: "Item removed" });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { inventory: true },
    });

    if (!product?.inventory || product.inventory.stock < quantity) {
      throw new AppError("Insufficient stock", 400);
    }

    const item = await prisma.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      update: { quantity },
      create: { cartId: cart.id, productId, quantity },
      include: { product: true },
    });

    res.json({
      ...item,
      product: formatProduct(item.product)
    });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/remove/:productId
cartRouter.delete("/remove/:productId", async (req: AuthRequest, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (!cart) throw new AppError("Cart not found", 404);

    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: req.params.productId },
    });

    res.json({ message: "Item removed from cart" });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/cart/clear
cartRouter.delete("/clear", async (req: AuthRequest, res, next) => {
  try {
    const cart = await prisma.cart.findUnique({ where: { userId: req.user!.userId } });
    if (!cart) throw new AppError("Cart not found", 404);

    await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    next(err);
  }
});
