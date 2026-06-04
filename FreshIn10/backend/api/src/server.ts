import "dotenv/config";
import express from "express";

// CRITICAL: Prevent server from crashing on unhandled errors
process.on("uncaughtException", (err) => {
  console.error("CRITICAL: Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("CRITICAL: Unhandled Rejection at:", promise, "reason:", reason);
});

import path from "path";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import { createServer } from "http";
import rateLimit from "express-rate-limit";
import { initSocket } from "./lib/socket";

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
export const io = initSocket(httpServer);

// Import routers
import { authRouter } from "./routes/auth";
import { productRouter } from "./routes/products";
import { categoryRouter } from "./routes/categories";
import { cartRouter } from "./routes/cart";
import { orderRouter } from "./routes/orders";
import { paymentRouter } from "./routes/payment";
import { adminRouter } from "./routes/admin";
import { deliveryRouter } from "./routes/delivery";
import { userRouter } from "./routes/users";
import { notificationRouter } from "./routes/notifications";
import { wishlistRouter } from "./routes/wishlist";
import { reviewRouter } from "./routes/reviews";
import { couponRouter } from "./routes/coupons";
import { ratingsRouter } from "./routes/ratings";
import { uploadRouter } from "./routes/upload";
import { setupSocketHandlers } from "./socket/handlers";
import { errorHandler } from "./middleware/errorHandler";
import { notFound } from "./middleware/notFound";

// Rate limiting disabled for unlimited access
const limiter = (req: any, res: any, next: any) => next();
const authLimiter = (req: any, res: any, next: any) => next();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
// app.use("/api", limiter); // Disabled rate limiting

// Serve static files from the public directory
app.use("/public", express.static(path.join(process.cwd(), "public")));

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString(), app: "FreshIn10 API" });
});

// Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);

app.get("/api/health", (req, res) => {
  res.json({ 
    status: "online", 
    dbUrl: process.env.DATABASE_URL ? "defined" : "missing",
    env: process.env.NODE_ENV
  });
});

app.use("/api/categories", categoryRouter);
app.use("/api/cart", cartRouter);
app.use("/api/orders", orderRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/admin", adminRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/users", userRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/ratings", ratingsRouter);
app.use("/api/upload", uploadRouter);
import { configRouter } from "./routes/config";
app.use("/api/config", configRouter);

// Socket.io handlers
setupSocketHandlers(io);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3003;

if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {
    console.log(`🚀 FreshIn10 API running on port ${PORT}`);
  });
}

export default app;
