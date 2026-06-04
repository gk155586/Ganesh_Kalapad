"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.paymentRouter = void 0;
const express_1 = require("express");
const razorpay_1 = __importDefault(require("razorpay"));
const crypto_1 = __importDefault(require("crypto"));
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const server_1 = require("../server");
exports.paymentRouter = (0, express_1.Router)();
const razorpay = new razorpay_1.default({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});
// POST /api/payment/create-order
exports.paymentRouter.post("/create-order", auth_1.authenticate, async (req, res, next) => {
    try {
        const { orderId } = zod_1.z.object({ orderId: zod_1.z.string() }).parse(req.body);
        const order = await prisma_1.prisma.order.findFirst({
            where: { id: orderId, userId: req.user.userId },
            include: { payment: true },
        });
        if (!order)
            throw new errorHandler_1.AppError("Order not found", 404);
        if (order.payment?.status === "SUCCESS")
            throw new errorHandler_1.AppError("Already paid", 400);
        const razorpayOrder = await razorpay.orders.create({
            amount: Math.round(order.total * 100), // paise
            currency: "INR",
            receipt: order.orderNumber,
            notes: {
                orderId: order.id,
                userId: req.user.userId,
            },
        });
        await prisma_1.prisma.payment.update({
            where: { orderId },
            data: { razorpayOrderId: razorpayOrder.id },
        });
        res.json({
            razorpayOrderId: razorpayOrder.id,
            amount: razorpayOrder.amount,
            currency: razorpayOrder.currency,
            keyId: process.env.RAZORPAY_KEY_ID,
        });
    }
    catch (err) {
        next(err);
    }
});
// POST /api/payment/verify
exports.paymentRouter.post("/verify", auth_1.authenticate, async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            razorpayOrderId: zod_1.z.string(),
            razorpayPaymentId: zod_1.z.string(),
            razorpaySignature: zod_1.z.string(),
            orderId: zod_1.z.string(),
        });
        const data = schema.parse(req.body);
        // Verify signature
        const body = `${data.razorpayOrderId}|${data.razorpayPaymentId}`;
        const expectedSignature = crypto_1.default
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");
        if (expectedSignature !== data.razorpaySignature) {
            throw new errorHandler_1.AppError("Payment verification failed", 400);
        }
        // Update payment and order
        await prisma_1.prisma.$transaction(async (tx) => {
            await tx.payment.update({
                where: { orderId: data.orderId },
                data: {
                    status: "SUCCESS",
                    razorpayPaymentId: data.razorpayPaymentId,
                    razorpaySignature: data.razorpaySignature,
                },
            });
            let deliveryPartnerId = null;
            const availablePartner = await tx.deliveryPartner.findFirst({
                where: { status: "AVAILABLE", isVerified: true },
            });
            if (availablePartner) {
                deliveryPartnerId = availablePartner.id;
                await tx.deliveryPartner.update({
                    where: { id: availablePartner.id },
                    data: { status: "BUSY" },
                });
            }
            await tx.order.update({
                where: { id: data.orderId },
                data: { status: "CONFIRMED", deliveryPartnerId },
            });
            await tx.orderTracking.create({
                data: {
                    orderId: data.orderId,
                    status: "CONFIRMED",
                    message: "Payment received. Order confirmed!",
                },
            });
            const order = await tx.order.findUnique({ where: { id: data.orderId } });
            if (order) {
                await tx.notification.create({
                    data: {
                        userId: order.userId,
                        type: "ORDER_UPDATE",
                        title: "Payment Successful!",
                        message: `Payment for order #${order.orderNumber} confirmed.`,
                        data: JSON.stringify({ orderId: order.id }),
                    },
                });
            }
        });
        const order = await prisma_1.prisma.order.findUnique({ where: { id: data.orderId } });
        if (order) {
            server_1.io.to(`user:${order.userId}`).emit("order:confirmed", { orderId: order.id });
            server_1.io.to("admin").emit("order:paid", { orderId: order.id });
            if (order.deliveryPartnerId) {
                server_1.io.to(`delivery:${order.deliveryPartnerId}`).emit("order:assigned", { orderId: order.id, orderNumber: order.orderNumber });
            }
        }
        res.json({ message: "Payment verified successfully" });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=payment.js.map