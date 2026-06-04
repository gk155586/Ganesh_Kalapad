import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, requireDelivery, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIO } from "../lib/socket";
import { formatProduct } from "./products";
import { isAutoAssignEnabled, getEarningPerOrder } from "./admin";

export const deliveryRouter = Router();

deliveryRouter.use(authenticate, requireDelivery);

// GET /api/delivery/orders/calendar — per-day stats grouped by date
deliveryRouter.get("/orders/calendar", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new AppError("Partner not found", 404);

    const { month, year } = req.query;
    const now = new Date();
    const y = Number(year) || now.getFullYear();
    const m = Number(month) || now.getMonth() + 1;
    const startDate = new Date(y, m - 1, 1);
    const endDate = new Date(y, m, 0, 23, 59, 59);

    const orders = await prisma.order.findMany({
      where: {
        deliveryPartnerId: partner.id,
        isHidden: false,
        status: { in: ["DELIVERED", "CANCELLED"] },
        createdAt: { gte: startDate, lte: endDate },
      },
      select: {
        id: true, orderNumber: true, status: true, total: true,
        paymentMethod: true, createdAt: true,
        assignedAt: true, deliveredAt: true,
        address: { select: { addressLine1: true, city: true } },
        payment: { select: { method: true, status: true, amount: true } },
        items: { select: { name: true, quantity: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by date
    const grouped: Record<string, any[]> = {};
    for (const o of orders) {
      const d = new Date(o.createdAt).toLocaleDateString("en-CA"); // YYYY-MM-DD
      if (!grouped[d]) grouped[d] = [];
      const amountCollected = o.paymentMethod === "COD" && o.payment?.status === "SUCCESS"
        ? (o.payment?.amount ?? o.total) : 0;
      grouped[d].push({
        id: o.id,
        orderNumber: o.orderNumber,
        status: o.status,
        total: o.total,
        paymentMethod: o.paymentMethod,
        amountCollected,
        address: o.address ? `${o.address.addressLine1}, ${o.address.city}` : "—",
        assignedAt: o.assignedAt,
        deliveredAt: o.deliveredAt,
        items: o.items,
      });
    }

    res.json({ grouped, month: m, year: y });
  } catch (err) { next(err); }
});


deliveryRouter.get("/orders/history", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new AppError("Partner not found", 404);

    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { deliveryPartnerId: partner.id, isHidden: false, status: { in: ["DELIVERED", "CANCELLED"] } },
        orderBy: { createdAt: "desc" },
        skip, take: Number(limit),
        select: {
          id: true, orderNumber: true, status: true, total: true,
          assignedAt: true, pickedUpAt: true, arrivedAt: true, deliveredAt: true, createdAt: true,
          items: { select: { name: true, quantity: true } },
          deliveryRating: { select: { rating: true, comment: true } },
        },
      }),
      prisma.order.count({ where: { deliveryPartnerId: partner.id, isHidden: false, status: { in: ["DELIVERED", "CANCELLED"] } } }),
    ]);

    res.json({ orders, total, page: Number(page), limit: Number(limit) });
  } catch (err) { next(err); }
});

// GET /api/delivery/earnings/breakdown — earnings by period
deliveryRouter.get("/earnings/breakdown", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new AppError("Partner not found", 404);

    const now = new Date();
    const todayStart = new Date(now); todayStart.setHours(0,0,0,0);
    const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7);
    const monthStart = new Date(now); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

    const [todayOrders, weekOrders, monthOrders, allOrders] = await Promise.all([
      prisma.order.count({ where: { deliveryPartnerId: partner.id, status: "DELIVERED", deliveredAt: { gte: todayStart } } }),
      prisma.order.count({ where: { deliveryPartnerId: partner.id, status: "DELIVERED", deliveredAt: { gte: weekStart } } }),
      prisma.order.count({ where: { deliveryPartnerId: partner.id, status: "DELIVERED", deliveredAt: { gte: monthStart } } }),
      prisma.order.count({ where: { deliveryPartnerId: partner.id, status: "DELIVERED" } }),
    ]);

    const earningPerOrder = getEarningPerOrder(); // dynamic from admin settings
    res.json({
      today: { orders: todayOrders, earnings: todayOrders * earningPerOrder },
      week: { orders: weekOrders, earnings: weekOrders * earningPerOrder },
      month: { orders: monthOrders, earnings: monthOrders * earningPerOrder },
      total: { orders: allOrders, earnings: partner.totalEarnings, points: partner.points, rating: partner.rating },
      earningRate: earningPerOrder, // send to frontend
    });
  } catch (err) { next(err); }
});


// GET /api/delivery/profile
deliveryRouter.get("/profile", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
      include: { user: { select: { name: true, email: true, phone: true, avatar: true } } },
    });
    if (!partner) throw new AppError("Delivery partner profile not found", 404);
    res.json(partner);
  } catch (err) {
    next(err);
  }
});

// PUT /api/delivery/status
deliveryRouter.put("/status", async (req: AuthRequest, res, next) => {
  try {
    const { status, latitude, longitude } = z.object({
      status: z.enum(["AVAILABLE", "BUSY", "OFFLINE"]),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).parse(req.body);

    const partner = await prisma.deliveryPartner.update({
      where: { userId: req.user!.userId },
      data: { status: status as any, latitude, longitude },
    });

    const io = getIO();
    io.to("admin").emit("delivery:status", { partnerId: partner.id, status });

    // Auto-assign logic — only if admin has enabled auto-assign
    if (status === "AVAILABLE" && partner.isVerified && isAutoAssignEnabled()) {
      const pendingOrder = await prisma.order.findFirst({
        where: { status: "PENDING", deliveryPartnerId: null },
        orderBy: { createdAt: "asc" }
      });

      if (pendingOrder) {
        const assignedOrder = await prisma.order.update({
          where: { id: pendingOrder.id },
          data: { deliveryPartnerId: partner.id, status: "CONFIRMED", assignedAt: new Date() },
          include: { deliveryPartner: { include: { user: { select: { name: true } } } } }
        });
        await prisma.orderTracking.create({
          data: { orderId: assignedOrder.id, status: "CONFIRMED", message: `Auto-assigned to ${assignedOrder.deliveryPartner?.user.name}` }
        });
        // Mark partner as BUSY so they don't get overwhelmed
        await prisma.deliveryPartner.update({
          where: { id: partner.id },
          data: { status: "BUSY" }
        });
        io.to(`partner:${partner.id}`).emit("order:assigned", assignedOrder);
        io.to(`user:${assignedOrder.userId}`).emit("order:status", { orderId: assignedOrder.id, status: "CONFIRMED" });
        io.to("admin").emit("delivery:status", { partnerId: partner.id, status: "BUSY" });
        io.to("admin").emit("order:updated", { orderId: assignedOrder.id, status: "CONFIRMED" });
      }
    }

    res.json(partner);
  } catch (err) {
    next(err);
  }
});

// GET /api/delivery/payouts
deliveryRouter.get("/payouts", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!partner) throw new AppError("Partner not found", 404);

    const payouts = await prisma.payout.findMany({
      where: { deliveryPartnerId: partner.id },
      orderBy: { createdAt: "desc" },
    });

    res.json(payouts);
  } catch (err) {
    next(err);
  }
});

// GET /api/delivery/orders - assigned orders
deliveryRouter.get("/orders", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!partner) throw new AppError("Partner not found", 404);

    const orders = await prisma.order.findMany({
      where: {
        deliveryPartnerId: partner.id,
        isHidden: false,
        status: { in: ["CONFIRMED", "PREPARING", "PICKED_UP", "OUT_FOR_DELIVERY"] },
      },
      orderBy: { createdAt: "desc" },
      include: {
        items: { include: { product: { select: { name: true, images: true } } } },
        address: true,
        user: { select: { name: true, phone: true } },
        payment: true,
      },
    });

    res.json(orders.map(order => ({
      ...order,
      items: order.items.map(item => ({
        ...item,
        product: formatProduct(item.product)
      }))
    })));
  } catch (err) {
    next(err);
  }
});

// GET /api/delivery/orders/available - Unassigned orders pool
deliveryRouter.get("/orders/available", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new AppError("Partner not found", 404);

    const orders = await prisma.order.findMany({
      where: {
        deliveryPartnerId: null,
        isHidden: false,
        status: "PENDING",
      },
      orderBy: { createdAt: "asc" },
      include: {
        items: { include: { product: { select: { name: true } } } },
        address: true,
      },
    });
    res.json(orders);
  } catch (err) { next(err); }
});

// PUT /api/delivery/orders/:id/accept - Accept an order
deliveryRouter.put("/orders/:id/accept", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
      include: { user: { select: { name: true } } }
    });
    if (!partner) throw new AppError("Partner not found", 404);

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, deliveryPartnerId: null, status: "PENDING" },
    });
    if (!order) throw new AppError("Order not available anymore", 400);

    const assignedOrder = await prisma.order.update({
      where: { id: order.id },
      data: { deliveryPartnerId: partner.id, status: "CONFIRMED", assignedAt: new Date() },
    });
    await prisma.orderTracking.create({
      data: { orderId: order.id, status: "CONFIRMED", message: `Accepted by ${partner.user.name}` }
    });
    await prisma.deliveryPartner.update({
      where: { id: partner.id },
      data: { status: "BUSY" }
    });

    const io = getIO();
    io.to(`user:${order.userId}`).emit("order:status", { orderId: order.id, status: "CONFIRMED" });
    io.to("admin").emit("delivery:status", { partnerId: partner.id, status: "BUSY" });
    io.to("admin").emit("order:updated", { orderId: order.id, status: "CONFIRMED" });

    res.json(assignedOrder);
  } catch (err) { next(err); }
});

// GET /api/delivery/orders/:id
deliveryRouter.get("/orders/:id", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!partner) throw new AppError("Partner not found", 404);

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, deliveryPartnerId: partner.id, isHidden: false },
      include: {
        items: { include: { product: { select: { name: true, images: true, price: true, unit: true } } } },
        address: true,
        user: { select: { name: true, phone: true } },
        tracking: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!order) throw new AppError("Order not found or not assigned to you", 404);
    
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

// PUT /api/delivery/orders/:id/pickup
deliveryRouter.put("/orders/:id/pickup", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!partner) throw new AppError("Partner not found", 404);

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, deliveryPartnerId: partner.id },
    });
    if (!order) throw new AppError("Order not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "PICKED_UP" },
      });
      await tx.orderTracking.create({
        data: { orderId: order.id, status: "PICKED_UP", message: "Order picked up from store" },
      });
    });

    const io = getIO();
    io.to(`user:${order.userId}`).emit("order:status", { orderId: order.id, status: "PICKED_UP" });
    res.json({ message: "Order marked as picked up" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/delivery/orders/:id/deliver
deliveryRouter.put("/orders/:id/deliver", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!partner) throw new AppError("Partner not found", 404);

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, deliveryPartnerId: partner.id },
    });
    if (!order) throw new AppError("Order not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
      // Mark COD payment as success
      await tx.payment.updateMany({
        where: { orderId: order.id, method: "COD" },
        data: { status: "SUCCESS" },
      });
      await tx.orderTracking.create({
        data: { orderId: order.id, status: "DELIVERED", message: "Order delivered successfully!" },
      });
      await tx.deliveryPartner.update({
        where: { id: partner.id },
        data: {
          totalOrders: { increment: 1 },
          totalEarnings: { increment: getEarningPerOrder() }, // dynamic from admin settings
          points: { increment: 20 },        // 20 points per delivery
          status: "AVAILABLE",
        },
      });
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER_UPDATE",
          title: "Order Delivered!",
          message: "Your order has been delivered. Enjoy your groceries!",
          data: JSON.stringify({ orderId: order.id }),
        },
      });
    });

    const io = getIO();
    io.to(`user:${order.userId}`).emit("order:delivered", { orderId: order.id });
    io.to("admin").emit("delivery:status", { partnerId: partner.id, status: "AVAILABLE" });
    io.to("admin").emit("order:updated", { orderId: order.id, status: "DELIVERED" });
    res.json({ message: "Order marked as delivered" });
  } catch (err) {
    next(err);
  }
});

// PUT /api/delivery/orders/:id/verify-payment
deliveryRouter.put("/orders/:id/verify-payment", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
    });
    if (!partner) throw new AppError("Partner not found", 404);

    const order = await prisma.order.findFirst({
      where: { id: req.params.id, deliveryPartnerId: partner.id },
      include: { payment: true }
    });
    if (!order) throw new AppError("Order not found", 404);
    if (order.paymentMethod !== "COD") throw new AppError("Only COD orders require payment verification", 400);

    await prisma.$transaction(async (tx) => {
      // Mark COD payment as success
      await tx.payment.updateMany({
        where: { orderId: order.id, method: "COD" },
        data: { status: "SUCCESS" },
      });
      await tx.orderTracking.create({
        data: { orderId: order.id, status: order.status, message: "Payment verified successfully" },
      });
    });

    res.json({ message: "Payment verified successfully" });
  } catch (err) {
    next(err);
  }
});

// GET /api/delivery/earnings
deliveryRouter.get("/earnings", async (req: AuthRequest, res, next) => {
  try {
    const partner = await prisma.deliveryPartner.findUnique({
      where: { userId: req.user!.userId },
      select: { totalEarnings: true, totalOrders: true, rating: true, points: true },
    });
    if (!partner) throw new AppError("Partner not found", 404);
    res.json(partner);
  } catch (err) {
    next(err);
  }
});

// PUT /api/delivery/orders/:id/bike-started
deliveryRouter.put("/orders/:id/bike-started", async (req: AuthRequest, res, next) => {
  try {
    const { latitude, longitude } = z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).parse(req.body);

    const partner = await prisma.deliveryPartner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new AppError("Partner not found", 404);
    const order = await prisma.order.findFirst({ where: { id: req.params.id, deliveryPartnerId: partner.id } });
    if (!order) throw new AppError("Order not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { status: "OUT_FOR_DELIVERY", bikeStartedAt: new Date() },
      });
      await tx.orderTracking.create({
        data: { orderId: order.id, status: "OUT_FOR_DELIVERY", message: "Delivery partner is on the way!", latitude, longitude },
      });
    });

    const io = getIO();
    io.to(`user:${order.userId}`).emit("order:status", { orderId: order.id, status: "OUT_FOR_DELIVERY" });
    res.json({ message: "Bike started" });
  } catch (err) { next(err); }
});

// PUT /api/delivery/orders/:id/arrived
deliveryRouter.put("/orders/:id/arrived", async (req: AuthRequest, res, next) => {
  try {
    const { latitude, longitude } = z.object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    }).parse(req.body);

    const partner = await prisma.deliveryPartner.findUnique({ where: { userId: req.user!.userId } });
    if (!partner) throw new AppError("Partner not found", 404);
    const order = await prisma.order.findFirst({ where: { id: req.params.id, deliveryPartnerId: partner.id } });
    if (!order) throw new AppError("Order not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: { arrivedAt: new Date() },
      });
      await tx.orderTracking.create({
        data: { orderId: order.id, status: "ARRIVED_AT_GATE", message: "Delivery partner arrived at your location!", latitude, longitude },
      });
      await tx.notification.create({
        data: {
          userId: order.userId,
          type: "ORDER_UPDATE",
          title: "Delivery Partner Arrived!",
          message: "Your delivery partner has arrived at your location. Please be ready to collect your order.",
          data: JSON.stringify({ orderId: order.id }),
        },
      });
    });

    const io = getIO();
    io.to(`user:${order.userId}`).emit("order:arrived", { orderId: order.id });
    res.json({ message: "Arrived at gate" });
  } catch (err) { next(err); }
});

// PUT /api/delivery/location
deliveryRouter.put("/location", async (req: AuthRequest, res, next) => {
  try {
    const { latitude, longitude } = z.object({
      latitude: z.number(),
      longitude: z.number(),
    }).parse(req.body);

    const partner = await prisma.deliveryPartner.update({
      where: { userId: req.user!.userId },
      data: { latitude, longitude },
      select: { id: true },
    });

    const io = getIO();
    io.to("admin").emit("delivery:location", { partnerId: partner.id, latitude, longitude });

    // Also emit to active orders this partner is handling
    const activeOrders = await prisma.order.findMany({
      where: { 
        deliveryPartnerId: partner.id, 
        status: { in: ["PICKED_UP", "OUT_FOR_DELIVERY"] } 
      },
      select: { id: true }
    });

    for (const order of activeOrders) {
      io.to(`order:${order.id}`).emit("order:location", { latitude, longitude });
    }

    res.json({ ok: true });
  } catch (err) { next(err); }
});
