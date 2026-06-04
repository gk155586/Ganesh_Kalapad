import { Router } from "express";
import Razorpay from "razorpay";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";
import { AppError } from "../middleware/errorHandler";
import { getIO } from "../lib/socket";

export const paymentRouter = Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// POST /api/payment/create-razorpay-order
paymentRouter.post("/create-razorpay-order", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const { orderId } = z.object({ orderId: z.string() }).parse(req.body);

    const order = await prisma.order.findUnique({
      where: { id: orderId, userId: req.user!.userId },
      include: { payment: true },
    });

    if (!order) throw new AppError("Order not found", 404);
    if (!order.payment) throw new AppError("Payment record not found for this order", 404);
    if (order.status !== "PENDING") throw new AppError("Payment already processed or order cancelled", 400);

    const razorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.total * 100), // in paise
      currency: "INR",
      receipt: order.orderNumber,
    });

    await prisma.payment.update({
      where: { id: order.payment.id },
      data: { razorpayOrderId: razorpayOrder.id },
    });

    res.json(razorpayOrder);
  } catch (err) {
    next(err);
  }
});

// POST /api/payment/verify
paymentRouter.post("/verify", authenticate, async (req: AuthRequest, res, next) => {
  try {
    const schema = z.object({
      razorpay_order_id: z.string(),
      razorpay_payment_id: z.string(),
      razorpay_signature: z.string(),
    });

    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = schema.parse(req.body);

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new AppError("Invalid payment signature", 400);
    }

    const payment = await prisma.payment.findUnique({
      where: { razorpayOrderId: razorpay_order_id },
      include: { order: true },
    });

    if (!payment) throw new AppError("Payment record not found", 404);

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "SUCCESS" },
      });

      await tx.order.update({
        where: { id: payment.orderId },
        data: { status: "CONFIRMED" },
      });

      await tx.orderTracking.create({
        data: {
          orderId: payment.orderId,
          status: "CONFIRMED",
          message: "Payment successful. Order confirmed!",
        },
      });

      // Send notifications
      await tx.notification.create({
        data: {
          userId: payment.order.userId,
          type: "ORDER_UPDATE",
          title: "Order Confirmed",
          message: "Your payment was successful and your order is confirmed!",
          data: JSON.stringify({ orderId: payment.orderId }),
        },
      });
    });

    const io = getIO();
    io.to(`user:${payment.order.userId}`).emit("order:status", { orderId: payment.orderId, status: "CONFIRMED" });
    io.to("admin").emit("order:updated", { orderId: payment.orderId, status: "CONFIRMED" });

    res.json({ message: "Payment verified successfully" });
  } catch (err) {
    next(err);
  }
});

// POST /api/payment/webhook
paymentRouter.post("/webhook", async (req, res) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET || "razorpay_webhook_secret";
  const signature = req.headers["x-razorpay-signature"] as string;

  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  if (expectedSignature === signature) {
    const { event, payload } = req.body;
    
    if (event === "payment.captured") {
      const razorpayOrderId = payload.payment.entity.order_id;
      
      const payment = await prisma.payment.findUnique({
        where: { razorpayOrderId },
        include: { order: true },
      });

      if (payment && payment.status !== "SUCCESS") {
        await prisma.$transaction(async (tx) => {
          await tx.payment.update({
            where: { id: payment.id },
            data: { status: "SUCCESS" },
          });

          await tx.order.update({
            where: { id: payment.orderId },
            data: { status: "CONFIRMED" },
          });

          await tx.orderTracking.create({
            data: {
              orderId: payment.orderId,
              status: "CONFIRMED",
              message: "Payment successful. Order confirmed!",
            },
          });
        });

        const io = getIO();
        io.to(`user:${payment.order.userId}`).emit("order:status", { orderId: payment.orderId, status: "CONFIRMED" });
      }
    }
  }

  res.json({ status: "ok" });
});
