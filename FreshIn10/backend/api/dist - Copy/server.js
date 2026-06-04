"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.io = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const morgan_1 = __importDefault(require("morgan"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const auth_1 = require("./routes/auth");
const products_1 = require("./routes/products");
const categories_1 = require("./routes/categories");
const cart_1 = require("./routes/cart");
const orders_1 = require("./routes/orders");
const payment_1 = require("./routes/payment");
const admin_1 = require("./routes/admin");
const delivery_1 = require("./routes/delivery");
const users_1 = require("./routes/users");
const notifications_1 = require("./routes/notifications");
const wishlist_1 = require("./routes/wishlist");
const reviews_1 = require("./routes/reviews");
const coupons_1 = require("./routes/coupons");
const ratings_1 = require("./routes/ratings");
const handlers_1 = require("./socket/handlers");
const errorHandler_1 = require("./middleware/errorHandler");
const notFound_1 = require("./middleware/notFound");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Socket.io setup
exports.io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
});
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === "development" ? 10000 : 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
    skip: (req) => {
        // Skip rate limiting for health check
        return req.path === "/health";
    },
    handler: (req, res) => {
        console.log(`⚠️  Rate limit exceeded for IP: ${req.ip} on path: ${req.path}`);
        res.status(429).json({
            error: "Too many requests, please try again later.",
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: process.env.NODE_ENV === "development" ? 1000 : 10,
    message: { error: "Too many auth attempts, please try again later." },
    handler: (req, res) => {
        console.log(`⚠️  Auth rate limit exceeded for IP: ${req.ip}`);
        res.status(429).json({
            error: "Too many auth attempts, please try again later.",
            retryAfter: Math.ceil(req.rateLimit.resetTime / 1000)
        });
    }
});
// Middleware
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use((0, cors_1.default)({
    origin: [
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001",
        process.env.NEXT_PUBLIC_DELIVERY_URL || "http://localhost:3002",
    ],
    credentials: true,
}));
app.use(express_1.default.json({ limit: "10mb" }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, morgan_1.default)("dev"));
app.use("/api", limiter);
// Health check
app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString(), app: "FreshIn10 API" });
});
// Routes
app.use("/api/auth", authLimiter, auth_1.authRouter);
app.use("/api/products", products_1.productRouter);
app.use("/api/categories", categories_1.categoryRouter);
app.use("/api/cart", cart_1.cartRouter);
app.use("/api/orders", orders_1.orderRouter);
app.use("/api/payment", payment_1.paymentRouter);
app.use("/api/admin", admin_1.adminRouter);
app.use("/api/delivery", delivery_1.deliveryRouter);
app.use("/api/users", users_1.userRouter);
app.use("/api/notifications", notifications_1.notificationRouter);
app.use("/api/wishlist", wishlist_1.wishlistRouter);
app.use("/api/reviews", reviews_1.reviewRouter);
app.use("/api/coupons", coupons_1.couponRouter);
app.use("/api/ratings", ratings_1.ratingsRouter);
// Socket.io handlers
(0, handlers_1.setupSocketHandlers)(exports.io);
// Error handling
app.use(notFound_1.notFound);
app.use(errorHandler_1.errorHandler);
const PORT = process.env.PORT || 3003;
if (process.env.NODE_ENV !== "test") {
    httpServer.listen(PORT, () => {
        console.log(`🚀 FreshIn10 API running on port ${PORT}`);
        console.log(`📡 Socket.io ready`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`🛡️  Rate limit: ${process.env.NODE_ENV === "development" ? "10,000" : "100"} requests per 15 minutes`);
    });
}
exports.default = app;
//# sourceMappingURL=server.js.map