"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deliveryRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const server_1 = require("../server");
const products_1 = require("./products");
exports.deliveryRouter = (0, express_1.Router)();
exports.deliveryRouter.use(auth_1.authenticate, auth_1.requireDelivery);
// GET /api/delivery/orders/history — completed orders
exports.deliveryRouter.get("/orders/history", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({ where: { userId: req.user.userId } });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const { page = 1, limit = 20 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [orders, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where: { deliveryPartnerId: partner.id, status: { in: ["DELIVERED", "CANCELLED"] } },
                orderBy: { createdAt: "desc" },
                skip, take: Number(limit),
                select: {
                    id: true, orderNumber: true, status: true, total: true,
                    assignedAt: true, pickedUpAt: true, arrivedAt: true, deliveredAt: true, createdAt: true,
                    items: { select: { name: true, quantity: true } },
                    deliveryRating: { select: { rating: true, comment: true } },
                },
            }),
            prisma_1.prisma.order.count({ where: { deliveryPartnerId: partner.id, status: { in: ["DELIVERED", "CANCELLED"] } } }),
        ]);
        res.json({ orders, total, page: Number(page), limit: Number(limit) });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/delivery/earnings/breakdown — earnings by period
exports.deliveryRouter.get("/earnings/breakdown", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({ where: { userId: req.user.userId } });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const now = new Date();
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        const monthStart = new Date(now);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);
        const [todayOrders, weekOrders, monthOrders, allOrders] = await Promise.all([
            prisma_1.prisma.order.count({ where: { deliveryPartnerId: partner.id, status: "DELIVERED", deliveredAt: { gte: todayStart } } }),
            prisma_1.prisma.order.count({ where: { deliveryPartnerId: partner.id, status: "DELIVERED", deliveredAt: { gte: weekStart } } }),
            prisma_1.prisma.order.count({ where: { deliveryPartnerId: partner.id, status: "DELIVERED", deliveredAt: { gte: monthStart } } }),
            prisma_1.prisma.order.count({ where: { deliveryPartnerId: partner.id, status: "DELIVERED" } }),
        ]);
        const earningPerOrder = 50; // flat ₹50 per delivery
        res.json({
            today: { orders: todayOrders, earnings: todayOrders * earningPerOrder },
            week: { orders: weekOrders, earnings: weekOrders * earningPerOrder },
            month: { orders: monthOrders, earnings: monthOrders * earningPerOrder },
            total: { orders: allOrders, earnings: partner.totalEarnings, points: partner.points, rating: partner.rating },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/delivery/profile
exports.deliveryRouter.get("/profile", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { userId: req.user.userId },
            include: { user: { select: { name: true, email: true, phone: true, avatar: true } } },
        });
        if (!partner)
            throw new errorHandler_1.AppError("Delivery partner profile not found", 404);
        res.json(partner);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/delivery/status
exports.deliveryRouter.put("/status", async (req, res, next) => {
    try {
        const { status, latitude, longitude } = zod_1.z.object({
            status: zod_1.z.enum(["AVAILABLE", "BUSY", "OFFLINE"]),
            latitude: zod_1.z.number().optional(),
            longitude: zod_1.z.number().optional(),
        }).parse(req.body);
        const partner = await prisma_1.prisma.deliveryPartner.update({
            where: { userId: req.user.userId },
            data: { status: status, latitude, longitude },
        });
        server_1.io.to("admin").emit("delivery:status", { partnerId: partner.id, status });
        res.json(partner);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/delivery/payouts
exports.deliveryRouter.get("/payouts", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { userId: req.user.userId },
        });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const payouts = await prisma_1.prisma.payout.findMany({
            where: { partnerId: partner.id },
            orderBy: { createdAt: "desc" },
        });
        res.json(payouts);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/delivery/orders - assigned orders
exports.deliveryRouter.get("/orders", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { userId: req.user.userId },
        });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const orders = await prisma_1.prisma.order.findMany({
            where: {
                deliveryPartnerId: partner.id,
                status: { in: ["CONFIRMED", "PREPARING", "PICKED_UP", "OUT_FOR_DELIVERY"] },
            },
            orderBy: { createdAt: "desc" },
            include: {
                items: { include: { product: { select: { name: true, images: true } } } },
                address: true,
                user: { select: { name: true, phone: true } },
            },
        });
        res.json(orders.map(order => ({
            ...order,
            items: order.items.map(item => ({
                ...item,
                product: (0, products_1.formatProduct)(item.product)
            }))
        })));
    }
    catch (err) {
        next(err);
    }
});
// GET /api/delivery/orders/:id
exports.deliveryRouter.get("/orders/:id", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { userId: req.user.userId },
        });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const order = await prisma_1.prisma.order.findFirst({
            where: { id: req.params.id, deliveryPartnerId: partner.id },
            include: {
                items: { include: { product: { select: { name: true, images: true, price: true, unit: true } } } },
                address: true,
                user: { select: { name: true, phone: true } },
                tracking: { orderBy: { createdAt: "desc" } },
            },
        });
        if (!order)
            throw new errorHandler_1.AppError("Order not found or not assigned to you", 404);
        const formattedOrder = {
            ...order,
            items: order.items.map(item => ({
                ...item,
                product: (0, products_1.formatProduct)(item.product)
            }))
        };
        res.json(formattedOrder);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/delivery/orders/:id/pickup
exports.deliveryRouter.put("/orders/:id/pickup", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { userId: req.user.userId },
        });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const order = await prisma_1.prisma.order.findFirst({
            where: { id: req.params.id, deliveryPartnerId: partner.id },
        });
        if (!order)
            throw new errorHandler_1.AppError("Order not found", 404);
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: order.id },
                data: { status: "PICKED_UP" },
            });
            await tx.orderTracking.create({
                data: { orderId: order.id, status: "PICKED_UP", message: "Order picked up from store" },
            });
        });
        server_1.io.to(`user:${order.userId}`).emit("order:status", { orderId: order.id, status: "PICKED_UP" });
        res.json({ message: "Order marked as picked up" });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/delivery/orders/:id/deliver
exports.deliveryRouter.put("/orders/:id/deliver", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { userId: req.user.userId },
        });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const order = await prisma_1.prisma.order.findFirst({
            where: { id: req.params.id, deliveryPartnerId: partner.id },
        });
        if (!order)
            throw new errorHandler_1.AppError("Order not found", 404);
        await prisma_1.prisma.$transaction(async (tx) => {
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
                    totalEarnings: { increment: 50 }, // flat delivery earning
                    points: { increment: 20 }, // 20 points per delivery
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
        server_1.io.to(`user:${order.userId}`).emit("order:delivered", { orderId: order.id });
        res.json({ message: "Order marked as delivered" });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/delivery/earnings
exports.deliveryRouter.get("/earnings", async (req, res, next) => {
    try {
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { userId: req.user.userId },
            select: { totalEarnings: true, totalOrders: true, rating: true, points: true },
        });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        res.json(partner);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/delivery/orders/:id/bike-started
exports.deliveryRouter.put("/orders/:id/bike-started", async (req, res, next) => {
    try {
        const { latitude, longitude } = zod_1.z.object({
            latitude: zod_1.z.number().optional(),
            longitude: zod_1.z.number().optional(),
        }).parse(req.body);
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({ where: { userId: req.user.userId } });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const order = await prisma_1.prisma.order.findFirst({ where: { id: req.params.id, deliveryPartnerId: partner.id } });
        if (!order)
            throw new errorHandler_1.AppError("Order not found", 404);
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: order.id },
                data: { status: "OUT_FOR_DELIVERY", bikeStartedAt: new Date() },
            });
            await tx.orderTracking.create({
                data: { orderId: order.id, status: "OUT_FOR_DELIVERY", message: "Delivery partner is on the way!", latitude, longitude },
            });
        });
        server_1.io.to(`user:${order.userId}`).emit("order:status", { orderId: order.id, status: "OUT_FOR_DELIVERY" });
        res.json({ message: "Bike started" });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/delivery/orders/:id/arrived
exports.deliveryRouter.put("/orders/:id/arrived", async (req, res, next) => {
    try {
        const { latitude, longitude } = zod_1.z.object({
            latitude: zod_1.z.number().optional(),
            longitude: zod_1.z.number().optional(),
        }).parse(req.body);
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({ where: { userId: req.user.userId } });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const order = await prisma_1.prisma.order.findFirst({ where: { id: req.params.id, deliveryPartnerId: partner.id } });
        if (!order)
            throw new errorHandler_1.AppError("Order not found", 404);
        await prisma_1.prisma.$transaction(async (tx) => {
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
        server_1.io.to(`user:${order.userId}`).emit("order:arrived", { orderId: order.id });
        res.json({ message: "Arrived at gate" });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/delivery/location
exports.deliveryRouter.put("/location", async (req, res, next) => {
    try {
        const { latitude, longitude } = zod_1.z.object({
            latitude: zod_1.z.number(),
            longitude: zod_1.z.number(),
        }).parse(req.body);
        const partner = await prisma_1.prisma.deliveryPartner.update({
            where: { userId: req.user.userId },
            data: { latitude, longitude },
            select: { id: true },
        });
        server_1.io.to("admin").emit("delivery:location", { partnerId: partner.id, latitude, longitude });
        res.json({ ok: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=delivery.js.map