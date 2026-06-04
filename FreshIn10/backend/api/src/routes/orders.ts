import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIO } from "../lib/socket";
import { generateOrderId } from "@freshin10/utils";
import { formatProduct } from "./products";
import { isAutoAssignEnabled } from "./admin";

export const orderRouter = Router();

orderRouter.use(authenticate);

// POST /api/orders/create
orderRouter.post("/create", async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      addressId: z.string(),
      items: z.array(z.object({
        productId: z.string(),
        quantity: z.number().positive(),
      })),
      paymentMethod: z.enum(["COD", "RAZORPAY", "UPI"]),
      notes: z.string().optional(),
      couponId: z.string().optional(),
    });

    const data = schema.parse(req.body);

    // Verify stock and get prices
    const productIds = data.items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { inventory: true }
    });

    if (products.length !== data.items.length) {
      throw new AppError("Some products are no longer available", 400);
    }

    let subtotal = 0;
    const orderItems: any[] = [];

    for (const item of data.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product || !product.inventory || product.inventory.stock < item.quantity) {
        throw new AppError(`Insufficient stock for ${product?.name}`, 400);
      }
      subtotal += product.price * item.quantity;
      let imageUrl = null;
      try {
        if (product.images) {
          const parsed = JSON.parse(product.images);
          imageUrl = Array.isArray(parsed) ? parsed[0] : parsed;
        }
      } catch (e) {
        imageUrl = null;
      }

      orderItems.push({
        productId: product.id,
        name: product.name,
        image: imageUrl,
        price: product.price,
        quantity: item.quantity,
        total: product.price * item.quantity,
      });
    }

    const deliveryFee = subtotal > 500 ? 0 : 40;
    const platformFee = 5;
    let discount = 0;

    if (data.couponId) {
      const coupon = await prisma.coupon.findUnique({ where: { id: data.couponId } });
      if (coupon && coupon.isActive) {
        if (coupon.type === "PERCENTAGE") {
          discount = (subtotal * coupon.value) / 100;
          if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
        } else {
          discount = coupon.value;
        }
      }
    }

    const total = subtotal + deliveryFee + platformFee - discount;

    // Generate daily sequential order number
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const todaysOrdersCount = await prisma.order.count({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        }
      }
    });

    const dateStr = [
      String(startOfToday.getDate()).padStart(2, '0'),
      String(startOfToday.getMonth() + 1).padStart(2, '0'),
      String(startOfToday.getFullYear()).slice(-2)
    ].join("");
    
    const orderNumber = `FI10-${dateStr}-#${todaysOrdersCount + 1}`;

    let order = await prisma.$transaction(async (tx) => {
      // 1. Create Order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId: req.user!.userId,
          addressId: data.addressId,
          subtotal,
          deliveryFee,
          platformFee,
          discount,
          total,
          paymentMethod: data.paymentMethod,
          notes: data.notes,
          couponId: data.couponId,
          status: "PENDING",
          items: { create: orderItems },
        },
      });

      // 2. Create Initial Payment
      await tx.payment.create({
        data: {
          orderId: newOrder.id,
          method: data.paymentMethod,
          amount: total,
          status: "PENDING",
        },
      });

      // 3. Create Initial Tracking
      await tx.orderTracking.create({
        data: {
          orderId: newOrder.id,
          status: "PENDING",
          message: "Order placed successfully",
        },
      });

      // 4. Update Stock
      for (const item of data.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // 5. Clear Cart
      const cart = await tx.cart.findUnique({ where: { userId: req.user!.userId } });
      if (cart) {
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      }

      return newOrder;
    });

    // AUTO-ASSIGN LOGIC
    if (isAutoAssignEnabled()) {
      const availablePartner = await prisma.deliveryPartner.findFirst({
        where: { status: "AVAILABLE", isVerified: true },
        orderBy: { totalOrders: "asc" }
      });

      if (availablePartner) {
        order = await prisma.order.update({
          where: { id: order.id },
          data: { deliveryPartnerId: availablePartner.id, status: "CONFIRMED", assignedAt: new Date() },
          include: { 
            items: { include: { product: true } }, 
            address: true, 
            deliveryPartner: { include: { user: { select: { name: true } } } } 
          }
        });
        await prisma.orderTracking.create({
          data: { orderId: order.id, status: "CONFIRMED", message: `Auto-assigned to ${(order as any).deliveryPartner?.user.name}` }
        });
        await prisma.deliveryPartner.update({
          where: { id: availablePartner.id },
          data: { status: "BUSY" }
        });
        const io = getIO();
        io.to(`partner:${availablePartner.id}`).emit("order:assigned", order);
        io.to(`user:${order.userId}`).emit("order:status", { orderId: order.id, status: "CONFIRMED" });
        io.to("admin").emit("delivery:status", { partnerId: availablePartner.id, status: "BUSY" });
        io.to("admin").emit("order:updated", { orderId: order.id, status: "CONFIRMED" });
      }
    }

    const io = getIO();
    io.to("admin").emit("order:new", order);

    res.status(201).json(order);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/history
orderRouter.get("/history", async (req: AuthRequest, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId: req.user!.userId },
        orderBy: { createdAt: "desc" },
        skip,
        take: Number(limit),
        include: {
          items: { include: { product: { select: { name: true, images: true } } } },
          payment: { select: { status: true, method: true } },
          deliveryRating: true,
        },
      }),
      prisma.order.count({ where: { userId: req.user!.userId } }),
    ]);

    const formattedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: formatProduct(item.product)
      }))
    }));

    res.json({ orders: formattedOrders, pagination: { page: Number(page), limit: Number(limit), total } });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id
orderRouter.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: {
        items: { include: { product: { select: { name: true, images: true, price: true, unit: true } } } },
        address: true,
        payment: true,
        tracking: { orderBy: { createdAt: "desc" } },
        deliveryPartner: { include: { user: { select: { name: true, phone: true, avatar: true } } } },
        deliveryRating: true,
      },
    });

    if (!order) throw new AppError("Order not found", 404);

    const formattedOrder = {
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: formatProduct(item.product)
      }))
    };

    res.json(formattedOrder);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/cancel
orderRouter.post("/:id/cancel", async (req: AuthRequest, res, next) => {
  try {
    const { reason } = z.object({ reason: z.string().min(5) }).parse(req.body);

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      include: { items: true },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (!["PENDING", "CONFIRMED"].includes(order.status)) {
      throw new AppError("Order cannot be cancelled at this stage", 400);
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED", cancelReason: reason, cancelledAt: new Date() },
      });

      await tx.orderTracking.create({
        data: { orderId: order.id, status: "CANCELLED", message: `Order cancelled: ${reason}` },
      });

      // Free up delivery partner if assigned
      if (order.deliveryPartnerId) {
        await tx.deliveryPartner.update({
          where: { id: order.deliveryPartnerId },
          data: { status: "AVAILABLE" }
        });
      }

      // Restore stock
      for (const item of order.items) {
        await tx.inventory.update({
          where: { productId: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // If COD, mark payment cancelled
      await tx.payment.updateMany({
        where: { orderId: order.id, method: "COD" },
        data: { status: "FAILED" },
      });
    });

    const io = getIO();
    io.to("admin").emit("order:updated", { orderId: order.id, status: "CANCELLED" });
    if (order.deliveryPartnerId) {
      io.to("admin").emit("delivery:status", { partnerId: order.deliveryPartnerId, status: "AVAILABLE" });
    }
    res.json({ message: "Order cancelled successfully" });
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/:id/tracking
orderRouter.get("/:id/tracking", async (req: AuthRequest, res, next) => {
  try {
    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      select: { 
        status: true, 
        deliveryPartner: { select: { latitude: true, longitude: true, user: { select: { name: true, phone: true } } } },
        tracking: { orderBy: { createdAt: "desc" } }
      },
    });

    if (!order) throw new AppError("Order not found", 404);
    res.json(order);
  } catch (err) {
    next(err);
  }
});

// POST /api/orders/:id/rate-delivery
orderRouter.post("/:id/rate-delivery", async (req: AuthRequest, res, next) => {
  try {
    const { rating, comment } = z.object({
      rating: z.number().min(1).max(5),
      comment: z.string().optional(),
    }).parse(req.body);

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, userId: req.user!.userId },
      select: { id: true, deliveryPartnerId: true, status: true }
    });

    if (!order || !order.deliveryPartnerId) throw new AppError("Invalid order", 400);
    if (order.status !== "DELIVERED") throw new AppError("Order not yet delivered", 400);

    const existing = await prisma.deliveryRating.findUnique({ where: { orderId: order.id } });
    if (existing) throw new AppError("Rating already submitted", 400);

    const deliveryRating = await prisma.$transaction(async (tx) => {
      const dr = await tx.deliveryRating.create({
        data: {
          orderId: order.id,
          deliveryPartnerId: order.deliveryPartnerId!,
          userId: req.user!.userId,
          rating,
          comment,
        }
      });

      // Update partner avg rating
      const allRatings = await tx.deliveryRating.findMany({
        where: { deliveryPartnerId: order.deliveryPartnerId! },
        select: { rating: true }
      });
      const avg = allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length;
      
      await tx.deliveryPartner.update({
        where: { id: order.deliveryPartnerId! },
        data: { rating: avg }
      });

      return dr;
    });

    res.status(201).json(deliveryRating);
  } catch (err) {
    next(err);
  }
});

// GET /api/orders/active
orderRouter.get("/active", async (req: AuthRequest, res, next) => {
  try {
    const orders = await prisma.order.findMany({
      where: {
        userId: req.user!.userId,
        status: { in: ["PENDING", "CONFIRMED", "PREPARING", "PICKED_UP", "OUT_FOR_DELIVERY"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { name: true, images: true } } } },
        payment: { select: { status: true, method: true } },
      },
    });

    const formattedOrders = orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: formatProduct(item.product)
      }))
    }));

    res.json(formattedOrders);
  } catch (err) {
    next(err);
  }
});
