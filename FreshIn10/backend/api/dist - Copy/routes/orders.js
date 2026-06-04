"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const server_1 = require("../server");
const utils_1 = require("@freshin10/utils");
const products_1 = require("./products");
exports.orderRouter = (0, express_1.Router)();
exports.orderRouter.use(auth_1.authenticate);
// POST /api/orders/create
exports.orderRouter.post("/create", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            addressId: zod_1.z.string(),
            items: zod_1.z.array(zod_1.z.object({
                productId: zod_1.z.string(),
                quantity: zod_1.z.number().int().positive(),
            })).min(1),
            couponCode: zod_1.z.string().optional(),
            paymentMethod: zod_1.z.enum(["RAZORPAY", "COD", "WALLET"]),
            notes: zod_1.z.string().optional(),
        });
        const data = schema.parse(req.body);
        const userId = req.user.userId;
        // Verify address belongs to user
        const address = await prisma_1.prisma.address.findFirst({
            where: { id: data.addressId, userId },
        });
        if (!address)
            throw new errorHandler_1.AppError("Address not found", 404);
        // Fetch products and validate stock
        const productIds = data.items.map((i) => i.productId);
        const products = await prisma_1.prisma.product.findMany({
            where: { id: { in: productIds }, isActive: true },
            include: { inventory: true },
        });
        if (products.length !== productIds.length) {
            throw new errorHandler_1.AppError("Some products are unavailable", 400);
        }
        // Calculate totals
        let subtotal = 0;
        const orderItems = data.items.map((item) => {
            const rawProduct = products.find((p) => p.id === item.productId);
            const product = (0, products_1.formatProduct)(rawProduct);
            if (!product.inventory || product.inventory.stock < item.quantity) {
                throw new errorHandler_1.AppError(`Insufficient stock for ${product.name}`, 400);
            }
            const total = product.price * item.quantity;
            subtotal += total;
            return {
                productId: item.productId,
                name: product.name,
                image: product.images?.[0] || null,
                price: product.price,
                quantity: item.quantity,
                total,
            };
        });
        const deliveryFee = subtotal >= 199 ? 0 : 29;
        const platformFee = 5;
        let discount = 0;
        let couponId;
        // Apply coupon
        if (data.couponCode) {
            const coupon = await prisma_1.prisma.coupon.findFirst({
                where: {
                    code: data.couponCode.toUpperCase(),
                    isActive: true,
                    OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
                },
            });
            if (!coupon)
                throw new errorHandler_1.AppError("Invalid or expired coupon", 400);
            if (subtotal < coupon.minOrderAmount) {
                throw new errorHandler_1.AppError(`Minimum order amount is ₹${coupon.minOrderAmount}`, 400);
            }
            // Check usage limit
            if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
                throw new errorHandler_1.AppError("Coupon usage limit reached", 400);
            }
            // Check per-user usage
            const used = await prisma_1.prisma.couponUsage.findUnique({
                where: { couponId_userId: { couponId: coupon.id, userId } },
            });
            if (used)
                throw new errorHandler_1.AppError("Coupon already used", 400);
            discount = coupon.type === "PERCENTAGE"
                ? Math.min((subtotal * coupon.value) / 100, coupon.maxDiscount || Infinity)
                : coupon.value;
            couponId = coupon.id;
        }
        // Wallet payment
        if (data.paymentMethod === "WALLET") {
            const user = await prisma_1.prisma.user.findUnique({ where: { id: userId } });
            const total = subtotal + deliveryFee + platformFee - discount;
            if (!user || user.walletBalance < total) {
                throw new errorHandler_1.AppError("Insufficient wallet balance", 400);
            }
        }
        const total = subtotal + deliveryFee + platformFee - discount;
        const orderNumber = (0, utils_1.generateOrderId)();
        // Only auto-assign immediately for COD or WALLET
        let assignedPartnerId = null;
        if (data.paymentMethod === "COD" || data.paymentMethod === "WALLET") {
            const availablePartner = await prisma_1.prisma.deliveryPartner.findFirst({
                where: { status: "AVAILABLE", isVerified: true },
            });
            if (availablePartner)
                assignedPartnerId = availablePartner.id;
        }
        // Create order in transaction
        const order = await prisma_1.prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    orderNumber,
                    userId,
                    addressId: data.addressId,
                    subtotal,
                    deliveryFee,
                    platformFee,
                    discount,
                    total,
                    paymentMethod: data.paymentMethod,
                    notes: data.notes,
                    couponId,
                    deliveryPartnerId: assignedPartnerId,
                    estimatedAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
                    items: { create: orderItems },
                    payment: {
                        create: {
                            method: data.paymentMethod,
                            amount: total,
                            status: data.paymentMethod === "COD" ? "PENDING" : "PENDING",
                        },
                    },
                    tracking: {
                        create: {
                            status: "PENDING",
                            message: "Order placed successfully",
                        },
                    },
                },
                include: {
                    items: true,
                    address: true,
                    payment: true,
                },
            });
            // Deduct stock
            for (const item of data.items) {
                await tx.inventory.update({
                    where: { productId: item.productId },
                    data: { stock: { decrement: item.quantity } },
                });
                await tx.product.update({
                    where: { id: item.productId },
                    data: { soldCount: { increment: item.quantity } },
                });
            }
            // Apply coupon usage
            if (couponId) {
                await tx.coupon.update({
                    where: { id: couponId },
                    data: { usedCount: { increment: 1 } },
                });
                await tx.couponUsage.create({
                    data: { couponId, userId, orderId: newOrder.id },
                });
            }
            // Deduct wallet
            if (data.paymentMethod === "WALLET") {
                await tx.user.update({
                    where: { id: userId },
                    data: { walletBalance: { decrement: total } },
                });
                await tx.payment.update({
                    where: { orderId: newOrder.id },
                    data: { status: "SUCCESS" },
                });
                await tx.order.update({
                    where: { id: newOrder.id },
                    data: { status: "CONFIRMED" },
                });
            }
            else if (data.paymentMethod === "COD") {
                await tx.order.update({
                    where: { id: newOrder.id },
                    data: { status: "CONFIRMED" },
                });
            }
            // Clear cart
            const cart = await tx.cart.findUnique({ where: { userId } });
            if (cart) {
                await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
            }
            // Create notification
            await tx.notification.create({
                data: {
                    userId,
                    type: "ORDER_UPDATE",
                    title: "Order Placed!",
                    message: `Your order #${orderNumber} has been placed successfully.`,
                    data: JSON.stringify({ orderId: newOrder.id }),
                },
            });
            // Update delivery partner status
            if (assignedPartnerId) {
                await tx.deliveryPartner.update({
                    where: { id: assignedPartnerId },
                    data: { status: "BUSY" },
                });
            }
            return newOrder;
        });
        // Emit socket event
        server_1.io.to(`user:${userId}`).emit("order:created", { orderId: order.id, orderNumber });
        server_1.io.to("admin").emit("order:new", { orderId: order.id, orderNumber, total });
        if (assignedPartnerId) {
            server_1.io.to(`delivery:${assignedPartnerId}`).emit("order:assigned", { orderId: order.id, orderNumber });
        }
        res.status(201).json(order);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/orders/history
exports.orderRouter.get("/history", async (req, res, next) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const [orders, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where: { userId: req.user.userId },
                orderBy: { createdAt: "desc" },
                skip,
                take: Number(limit),
                include: {
                    items: { include: { product: { select: { images: true } } } },
                    payment: { select: { status: true, method: true } },
                },
            }),
            prisma_1.prisma.order.count({ where: { userId: req.user.userId } }),
        ]);
        res.json({ orders, pagination: { page: Number(page), limit: Number(limit), total } });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/orders/track/:id
exports.orderRouter.get("/track/:id", async (req, res, next) => {
    try {
        const order = await prisma_1.prisma.order.findFirst({
            where: {
                OR: [{ id: req.params.id }, { orderNumber: req.params.id }],
                userId: req.user.userId,
            },
            include: {
                items: { include: { product: { select: { name: true, images: true } } } },
                address: true,
                payment: true,
                tracking: { orderBy: { createdAt: "asc" } },
                deliveryPartner: {
                    include: {
                        user: { select: { name: true, phone: true, avatar: true } },
                    },
                },
            },
        });
        if (!order)
            throw new errorHandler_1.AppError("Order not found", 404);
        res.json(order);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/orders/:id/cancel
exports.orderRouter.post("/:id/cancel", async (req, res, next) => {
    try {
        const { reason } = zod_1.z.object({ reason: zod_1.z.string().optional() }).parse(req.body);
        const order = await prisma_1.prisma.order.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
            include: { payment: true },
        });
        if (!order)
            throw new errorHandler_1.AppError("Order not found", 404);
        const cancellableStatuses = ["PENDING", "CONFIRMED"];
        if (!cancellableStatuses.includes(order.status)) {
            throw new errorHandler_1.AppError("Order cannot be cancelled at this stage", 400);
        }
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: order.id },
                data: {
                    status: "CANCELLED",
                    cancelledAt: new Date(),
                    cancelReason: reason,
                },
            });
            // Restore stock
            const items = await tx.orderItem.findMany({ where: { orderId: order.id } });
            for (const item of items) {
                await tx.inventory.update({
                    where: { productId: item.productId },
                    data: { stock: { increment: item.quantity } },
                });
            }
            // Refund if paid
            if (order.payment?.status === "SUCCESS") {
                await tx.user.update({
                    where: { id: req.user.userId },
                    data: { walletBalance: { increment: order.total } },
                });
                await tx.payment.update({
                    where: { orderId: order.id },
                    data: { status: "REFUNDED", refundAmount: order.total, refundedAt: new Date() },
                });
            }
            await tx.notification.create({
                data: {
                    userId: req.user.userId,
                    type: "ORDER_UPDATE",
                    title: "Order Cancelled",
                    message: `Your order #${order.orderNumber} has been cancelled.`,
                    data: JSON.stringify({ orderId: order.id }),
                },
            });
        });
        server_1.io.to(`user:${req.user.userId}`).emit("order:cancelled", { orderId: order.id });
        res.json({ message: "Order cancelled successfully" });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=orders.js.map