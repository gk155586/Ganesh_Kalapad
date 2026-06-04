"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const server_1 = require("../server");
const utils_1 = require("@freshin10/utils");
const products_1 = require("./products");
exports.adminRouter = (0, express_1.Router)();
exports.adminRouter.use(auth_1.authenticate, auth_1.requireAdmin);
// ─── DASHBOARD ────────────────────────────────────────────────────────────────
exports.adminRouter.get("/dashboard", async (req, res, next) => {
    try {
        const { from, to } = req.query;
        const startDate = from ? new Date(String(from)) : new Date();
        if (!from)
            startDate.setDate(startDate.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        const endDate = to ? new Date(String(to)) : new Date();
        endDate.setHours(23, 59, 59, 999);
        const prevStartDate = new Date(startDate);
        prevStartDate.setDate(prevStartDate.getDate() - (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const [rangeRevenue, prevRevenue, rangeOrders, prevOrders, totalUsers, totalProducts, pendingOrders, lowStockProducts, recentOrders, topProducts, categories, activePartners,] = await Promise.all([
            prisma_1.prisma.payment.aggregate({
                where: { status: "SUCCESS", createdAt: { gte: startDate, lte: endDate } },
                _sum: { amount: true },
            }),
            prisma_1.prisma.payment.aggregate({
                where: { status: "SUCCESS", createdAt: { gte: prevStartDate, lt: startDate } },
                _sum: { amount: true },
            }),
            prisma_1.prisma.order.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
            prisma_1.prisma.order.count({ where: { createdAt: { gte: prevStartDate, lt: startDate } } }),
            prisma_1.prisma.user.count({ where: { role: "CUSTOMER" } }),
            prisma_1.prisma.product.count({ where: { isActive: true } }),
            prisma_1.prisma.order.count({ where: { status: { in: ["PENDING", "CONFIRMED", "PREPARING"] } } }),
            prisma_1.prisma.inventory.findMany({
                where: { stock: { lte: 10 } },
                include: { product: { select: { name: true, images: true } } },
                take: 5,
            }),
            prisma_1.prisma.order.findMany({
                orderBy: { createdAt: "desc" },
                take: 10,
                include: {
                    user: { select: { name: true, email: true } },
                    payment: { select: { status: true } },
                },
            }),
            prisma_1.prisma.product.findMany({
                orderBy: { soldCount: "desc" },
                take: 5,
                select: { id: true, name: true, soldCount: true, price: true, images: true },
            }),
            prisma_1.prisma.category.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    products: {
                        where: { isActive: true },
                        select: {
                            items: {
                                select: {
                                    total: true,
                                    order: { select: { payment: { select: { status: true } } } }
                                }
                            }
                        }
                    }
                }
            }),
            prisma_1.prisma.deliveryPartner.count({ where: { status: { in: ["AVAILABLE", "BUSY"] } } }),
        ]);
        // Calculate revenue by category (simplified for dashboard)
        const revenueByCategory = categories.map(cat => {
            let revenue = 0;
            cat.products.forEach(p => {
                p.items.forEach(item => {
                    if (item.order.payment?.status === "SUCCESS") {
                        revenue += item.total;
                    }
                });
            });
            return { name: cat.name, revenue };
        }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);
        // Calculate percentage changes
        const calcChange = (curr, prev) => {
            if (!prev)
                return "+100%";
            const change = ((curr - prev) / prev) * 100;
            return (change >= 0 ? "+" : "") + change.toFixed(1) + "%";
        };
        res.json({
            stats: {
                totalRevenue: rangeRevenue._sum.amount || 0,
                revenueChange: calcChange(rangeRevenue._sum.amount || 0, prevRevenue._sum.amount || 0),
                rangeOrders,
                ordersChange: calcChange(rangeOrders, prevOrders),
                totalUsers,
                totalProducts,
                pendingOrders,
                activePartners,
            },
            lowStockProducts: lowStockProducts.map(ls => ({
                ...ls,
                product: (0, products_1.formatProduct)(ls.product)
            })),
            recentOrders,
            topProducts: topProducts.map(products_1.formatProduct),
            revenueByCategory,
            chartData: await getChartData(startDate, endDate),
        });
    }
    catch (err) {
        next(err);
    }
});
async function getChartData(start, end) {
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const data = [];
    for (let i = 0; i <= days; i++) {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        const dayStart = new Date(d.setHours(0, 0, 0, 0));
        const dayEnd = new Date(d.setHours(23, 59, 59, 999));
        const [revenue, orders] = await Promise.all([
            prisma_1.prisma.payment.aggregate({
                where: { status: "SUCCESS", createdAt: { gte: dayStart, lte: dayEnd } },
                _sum: { amount: true },
            }),
            prisma_1.prisma.order.count({
                where: { createdAt: { gte: dayStart, lte: dayEnd } },
            }),
        ]);
        data.push({
            day: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
            revenue: revenue._sum.amount || 0,
            orders,
        });
    }
    return data;
}
// ─── PRODUCTS ─────────────────────────────────────────────────────────────────
exports.adminRouter.get("/products", async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, category } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search)
            where.name = { contains: String(search), mode: "insensitive" };
        if (category)
            where.categoryId = String(category);
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    category: { select: { name: true } },
                    inventory: { select: { stock: true } },
                },
            }),
            prisma_1.prisma.product.count({ where }),
        ]);
        res.json({ products: products.map(products_1.formatProduct), pagination: { page: Number(page), limit: Number(limit), total } });
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.post("/products", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2),
            description: zod_1.z.string().optional(),
            price: zod_1.z.number().positive(),
            mrp: zod_1.z.number().positive(),
            unit: zod_1.z.string().min(1),
            stock: zod_1.z.number().int().min(0),
            categoryId: zod_1.z.string(),
            images: zod_1.z.array(zod_1.z.string()).min(1),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
            isActive: zod_1.z.boolean().default(true),
            isFeatured: zod_1.z.boolean().default(false),
            isTrending: zod_1.z.boolean().default(false),
        });
        const data = schema.parse(req.body);
        const slug = (0, utils_1.slugify)(data.name) + "-" + Date.now();
        const { stock, images, tags, ...productData } = data;
        const product = await prisma_1.prisma.product.create({
            data: {
                ...productData,
                slug,
                images: JSON.stringify(images),
                tags: JSON.stringify(tags || []),
                inventory: { create: { stock } },
            },
            include: { inventory: true, category: true },
        });
        res.status(201).json((0, products_1.formatProduct)(product));
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.put("/products/:id", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2).optional(),
            description: zod_1.z.string().optional(),
            price: zod_1.z.number().positive().optional(),
            mrp: zod_1.z.number().positive().optional(),
            unit: zod_1.z.string().optional(),
            stock: zod_1.z.number().int().min(0).optional(),
            categoryId: zod_1.z.string().optional(),
            images: zod_1.z.array(zod_1.z.string()).optional(),
            tags: zod_1.z.array(zod_1.z.string()).optional(),
            isActive: zod_1.z.boolean().optional(),
            isFeatured: zod_1.z.boolean().optional(),
            isTrending: zod_1.z.boolean().optional(),
        });
        const data = schema.parse(req.body);
        const { stock, images, tags, ...productData } = data;
        const product = await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: {
                ...productData,
                ...(images && { images: JSON.stringify(images) }),
                ...(tags && { tags: JSON.stringify(tags) }),
                ...(stock !== undefined && {
                    inventory: { update: { stock } },
                }),
            },
            include: { inventory: true, category: true },
        });
        res.json((0, products_1.formatProduct)(product));
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.delete("/products/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.product.update({
            where: { id: req.params.id },
            data: { isActive: false },
        });
        res.json({ message: "Product deactivated" });
    }
    catch (err) {
        next(err);
    }
});
// ─── ORDERS ───────────────────────────────────────────────────────────────────
exports.adminRouter.get("/orders", async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = String(status);
        if (search) {
            where.OR = [
                { orderNumber: { contains: String(search), mode: "insensitive" } },
                { user: { name: { contains: String(search), mode: "insensitive" } } },
                { user: { email: { contains: String(search), mode: "insensitive" } } },
                { user: { phone: { contains: String(search), mode: "insensitive" } } },
            ];
        }
        const [orders, total] = await Promise.all([
            prisma_1.prisma.order.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true, email: true, phone: true } },
                    address: true,
                    items: { include: { product: { select: { name: true, images: true } } } },
                    payment: true,
                    deliveryPartner: { include: { user: { select: { name: true, phone: true } } } },
                },
            }),
            prisma_1.prisma.order.count({ where }),
        ]);
        res.json({
            orders: orders.map(order => ({
                ...order,
                items: order.items.map(item => ({
                    ...item,
                    product: (0, products_1.formatProduct)(item.product)
                }))
            })),
            pagination: { page: Number(page), limit: Number(limit), total }
        });
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.put("/orders/:id/status", async (req, res, next) => {
    try {
        const { status, message, deliveryPartnerId } = zod_1.z.object({
            status: zod_1.z.enum(["CONFIRMED", "PREPARING", "PICKED_UP", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED"]),
            message: zod_1.z.string().optional(),
            deliveryPartnerId: zod_1.z.string().optional(),
        }).parse(req.body);
        const order = await prisma_1.prisma.order.update({
            where: { id: req.params.id },
            data: {
                status: status,
                ...(deliveryPartnerId && { deliveryPartnerId }),
                ...(status === "DELIVERED" && { deliveredAt: new Date() }),
            },
        });
        await prisma_1.prisma.orderTracking.create({
            data: {
                orderId: order.id,
                status: status,
                message: message || `Order status updated to ${status}`,
            },
        });
        await prisma_1.prisma.notification.create({
            data: {
                userId: order.userId,
                type: "ORDER_UPDATE",
                title: "Order Update",
                message: message || `Your order is now ${status.toLowerCase().replace(/_/g, " ")}`,
                data: JSON.stringify({ orderId: order.id }),
            },
        });
        server_1.io.to(`user:${order.userId}`).emit("order:status", { orderId: order.id, status });
        server_1.io.to("admin").emit("order:updated", { orderId: order.id, status });
        res.json(order);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.delete("/orders/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.order.delete({ where: { id: req.params.id } });
        res.json({ message: "Order deleted successfully" });
    }
    catch (err) {
        next(err);
    }
});
// ─── USERS ────────────────────────────────────────────────────────────────────
exports.adminRouter.get("/users", async (req, res, next) => {
    try {
        const { page = 1, limit = 20, search, role } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: String(search), mode: "insensitive" } },
                { email: { contains: String(search), mode: "insensitive" } },
            ];
        }
        if (role)
            where.role = String(role);
        const [users, total] = await Promise.all([
            prisma_1.prisma.user.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                select: {
                    id: true, name: true, email: true, phone: true,
                    role: true, isActive: true, walletBalance: true,
                    createdAt: true, _count: { select: { orders: true } },
                },
            }),
            prisma_1.prisma.user.count({ where }),
        ]);
        res.json({ users, pagination: { page: Number(page), limit: Number(limit), total } });
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.put("/users/:id/status", async (req, res, next) => {
    try {
        const { isActive } = zod_1.z.object({ isActive: zod_1.z.boolean() }).parse(req.body);
        // Find user to protect the main admin
        const target = await prisma_1.prisma.user.findUnique({ where: { id: req.params.id }, select: { email: true } });
        if (target?.email === "admin@freshin10.com") {
            throw new errorHandler_1.AppError("Cannot modify the main admin account", 403);
        }
        const user = await prisma_1.prisma.user.update({
            where: { id: req.params.id },
            data: { isActive },
            select: { id: true, name: true, email: true, isActive: true },
        });
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
// ─── TEAM MANAGEMENT ──────────────────────────────────────────────────────────
exports.adminRouter.post("/team", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2),
            email: zod_1.z.string().email(),
            password: zod_1.z.string().min(8),
            phone: zod_1.z.string().optional(),
            role: zod_1.z.enum(["ADMIN", "DELIVERY"]),
            vehicleType: zod_1.z.string().optional(),
            vehicleNo: zod_1.z.string().optional(),
            licenseNo: zod_1.z.string().optional(),
        });
        const data = schema.parse(req.body);
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: data.email } });
        if (existing)
            throw new errorHandler_1.AppError("Email already registered", 409);
        const hashedPassword = await bcryptjs_1.default.hash(data.password, 12);
        const user = await prisma_1.prisma.user.create({
            data: {
                name: data.name,
                email: data.email,
                password: hashedPassword,
                phone: data.phone,
                role: data.role,
                isVerified: true,
            },
        });
        if (data.role === "DELIVERY") {
            await prisma_1.prisma.deliveryPartner.create({
                data: {
                    userId: user.id,
                    status: "OFFLINE",
                    isVerified: false, // Required manual approval
                    vehicleType: data.vehicleType || "BIKE",
                    vehicleNo: data.vehicleNo || "",
                    licenseNo: data.licenseNo || "",
                },
            });
        }
        const { password: _, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.get("/team", async (_req, res, next) => {
    try {
        const members = await prisma_1.prisma.user.findMany({
            where: {
                role: { in: ["ADMIN", "DELIVERY"] },
                email: { not: "admin@freshin10.com" },
            },
            orderBy: { createdAt: "desc" },
            select: {
                id: true, name: true, email: true, phone: true, role: true, isActive: true, createdAt: true,
                deliveryPartner: {
                    select: { id: true, userId: true, isVerified: true, vehicleNo: true, rating: true, totalOrders: true }
                }
            },
        });
        res.json(members);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.delete("/team/:id", async (req, res, next) => {
    try {
        const target = await prisma_1.prisma.user.findUnique({ where: { id: req.params.id }, select: { email: true, role: true } });
        if (!target)
            throw new errorHandler_1.AppError("User not found", 404);
        if (target.email === "admin@freshin10.com") {
            throw new errorHandler_1.AppError("Cannot delete the main admin account", 403);
        }
        if (!['ADMIN', 'DELIVERY'].includes(target.role)) {
            throw new errorHandler_1.AppError("Can only remove admins or delivery partners", 403);
        }
        await prisma_1.prisma.user.delete({ where: { id: req.params.id } });
        res.json({ message: "Team member removed" });
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.put("/team/:id", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2).optional(),
            email: zod_1.z.string().email().optional(),
            phone: zod_1.z.string().optional(),
            role: zod_1.z.enum(["ADMIN", "DELIVERY"]).optional(),
            isActive: zod_1.z.boolean().optional(),
            // Delivery Partner fields
            vehicleType: zod_1.z.string().optional(),
            vehicleNo: zod_1.z.string().optional(),
            licenseNo: zod_1.z.string().optional(),
            bankName: zod_1.z.string().optional(),
            accountNo: zod_1.z.string().optional(),
            ifscCode: zod_1.z.string().optional(),
            upiId: zod_1.z.string().optional(),
            isVerified: zod_1.z.boolean().optional(),
        });
        const data = schema.parse(req.body);
        const { vehicleType, vehicleNo, licenseNo, bankName, accountNo, ifscCode, upiId, isVerified, ...userData } = data;
        const user = await prisma_1.prisma.user.update({
            where: { id: req.params.id },
            data: {
                ...userData,
                ...((vehicleType || vehicleNo || licenseNo || bankName || accountNo || ifscCode || upiId || isVerified !== undefined) && {
                    deliveryPartner: {
                        update: {
                            ...(vehicleType && { vehicleType }),
                            ...(vehicleNo && { vehicleNo }),
                            ...(licenseNo && { licenseNo }),
                            ...(bankName && { bankName }),
                            ...(accountNo && { accountNo }),
                            ...(ifscCode && { ifscCode }),
                            ...(upiId && { upiId }),
                            ...(isVerified !== undefined && { isVerified }),
                        }
                    }
                })
            },
            include: { deliveryPartner: true }
        });
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    }
    catch (err) {
        next(err);
    }
});
// ─── CATEGORIES ───────────────────────────────────────────────────────────────
exports.adminRouter.post("/categories", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2),
            description: zod_1.z.string().optional(),
            image: zod_1.z.string().optional(),
            icon: zod_1.z.string().optional(),
            color: zod_1.z.string().optional(),
            sortOrder: zod_1.z.number().default(0),
            parentId: zod_1.z.string().optional(),
        });
        const data = schema.parse(req.body);
        const slug = (0, utils_1.slugify)(data.name);
        const category = await prisma_1.prisma.category.create({
            data: { ...data, slug },
        });
        res.status(201).json(category);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.put("/categories/:id", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2).optional(),
            description: zod_1.z.string().optional(),
            image: zod_1.z.string().optional(),
            icon: zod_1.z.string().optional(),
            color: zod_1.z.string().optional(),
        });
        const data = schema.parse(req.body);
        const update = { ...data };
        if (data.name)
            update.slug = (0, utils_1.slugify)(data.name);
        const category = await prisma_1.prisma.category.update({ where: { id: req.params.id }, data: update });
        res.json(category);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.delete("/categories/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.category.delete({ where: { id: req.params.id } });
        res.json({ message: "Category deleted" });
    }
    catch (err) {
        next(err);
    }
});
// ─── COUPONS ──────────────────────────────────────────────────────────────────
exports.adminRouter.get("/coupons", async (_req, res, next) => {
    try {
        const coupons = await prisma_1.prisma.coupon.findMany({
            orderBy: { createdAt: "desc" },
            include: { _count: { select: { usages: true } } },
        });
        res.json(coupons);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.post("/coupons", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            code: zod_1.z.string().min(3).max(20),
            type: zod_1.z.enum(["PERCENTAGE", "FLAT"]),
            value: zod_1.z.number().positive(),
            minOrderAmount: zod_1.z.number().min(0).default(0),
            maxDiscount: zod_1.z.number().optional(),
            usageLimit: zod_1.z.number().int().positive().optional(),
            expiresAt: zod_1.z.string().datetime().optional(),
            isActive: zod_1.z.boolean().default(true),
        });
        const data = schema.parse(req.body);
        const coupon = await prisma_1.prisma.coupon.create({
            data: {
                ...data,
                code: data.code.toUpperCase(),
                expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
            },
        });
        res.status(201).json(coupon);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.put("/coupons/:id", async (req, res, next) => {
    try {
        const { isActive } = zod_1.z.object({ isActive: zod_1.z.boolean() }).parse(req.body);
        const coupon = await prisma_1.prisma.coupon.update({ where: { id: req.params.id }, data: { isActive } });
        res.json(coupon);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.delete("/coupons/:id", async (req, res, next) => {
    try {
        await prisma_1.prisma.coupon.delete({ where: { id: req.params.id } });
        res.json({ message: "Coupon deleted" });
    }
    catch (err) {
        next(err);
    }
});
// ─── ANALYTICS ────────────────────────────────────────────────────────────────
exports.adminRouter.get("/analytics/revenue", async (req, res, next) => {
    try {
        const { days = 7 } = req.query;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - Number(days));
        const revenue = await prisma_1.prisma.payment.groupBy({
            by: ["createdAt"],
            where: {
                status: "SUCCESS",
                createdAt: { gte: startDate },
            },
            _sum: { amount: true },
            _count: true,
        });
        res.json(revenue);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.get("/analytics/summary", async (_req, res, next) => {
    try {
        const [orders, users, partners, products] = await Promise.all([
            prisma_1.prisma.order.count(),
            prisma_1.prisma.user.count({ where: { role: "CUSTOMER" } }),
            prisma_1.prisma.deliveryPartner.count(),
            prisma_1.prisma.product.count(),
        ]);
        res.json({ orders, users, partners, products });
    }
    catch (err) {
        next(err);
    }
});
// ─── DELIVERY PARTNERS ────────────────────────────────────────────────────────
exports.adminRouter.get("/delivery-partners", async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, isVerified } = req.query;
        const skip = (Number(page) - 1) * Number(limit);
        const where = {};
        if (status)
            where.status = String(status);
        if (isVerified !== undefined)
            where.isVerified = isVerified === "true";
        const [partners, total] = await Promise.all([
            prisma_1.prisma.deliveryPartner.findMany({
                where,
                skip,
                take: Number(limit),
                orderBy: { createdAt: "desc" },
                include: {
                    user: { select: { name: true, email: true, phone: true, avatar: true, isActive: true } },
                    _count: { select: { orders: true } },
                },
            }),
            prisma_1.prisma.deliveryPartner.count({ where }),
        ]);
        res.json({ partners, pagination: { page: Number(page), limit: Number(limit), total } });
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.get("/delivery-partners/:id", async (req, res, next) => {
    const start = Date.now();
    try {
        const partnerId = req.params.id;
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { id: partnerId },
            include: {
                user: { select: { id: true, name: true, email: true, phone: true, avatar: true, role: true, isActive: true, createdAt: true } },
            },
        });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const [ratings, payouts, orders] = await Promise.all([
            prisma_1.prisma.deliveryRating.findMany({ where: { deliveryPartnerId: partnerId }, orderBy: { createdAt: "desc" }, take: 20 }),
            prisma_1.prisma.payout.findMany({ where: { deliveryPartnerId: partnerId }, orderBy: { createdAt: "desc" }, take: 20 }),
            prisma_1.prisma.order.findMany({
                where: { deliveryPartnerId: partnerId },
                orderBy: { createdAt: "desc" },
                take: 50,
                select: {
                    id: true, orderNumber: true, status: true, total: true,
                    deliveredAt: true, createdAt: true,
                    deliveryRating: { select: { rating: true, comment: true } },
                },
            })
        ]);
        console.log(`[Admin] Partner profile fetched in ${Date.now() - start}ms`);
        res.json({ ...partner, ratings, payouts, orders });
    }
    catch (err) {
        console.error("[Admin] Error fetching partner:", err);
        next(err);
    }
});
exports.adminRouter.put("/delivery-partners/:id", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2).optional().or(zod_1.z.literal("")),
            email: zod_1.z.string().email().optional().or(zod_1.z.literal("")),
            phone: zod_1.z.string().optional().or(zod_1.z.literal("")),
            isActive: zod_1.z.boolean().optional(),
            vehicleType: zod_1.z.string().optional().or(zod_1.z.literal("")),
            vehicleNo: zod_1.z.string().optional().or(zod_1.z.literal("")),
            licenseNo: zod_1.z.string().optional().or(zod_1.z.literal("")),
            bankName: zod_1.z.string().optional().or(zod_1.z.literal("")),
            accountNo: zod_1.z.string().optional().or(zod_1.z.literal("")),
            ifscCode: zod_1.z.string().optional().or(zod_1.z.literal("")),
            upiId: zod_1.z.string().optional().or(zod_1.z.literal("")),
            status: zod_1.z.string().optional(),
            isVerified: zod_1.z.boolean().optional(),
        });
        const data = schema.parse(req.body);
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({
            where: { id: req.params.id },
            include: { user: true }
        });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        // Update Partner Data
        const updatedPartner = await prisma_1.prisma.deliveryPartner.update({
            where: { id: req.params.id },
            data: {
                vehicleType: data.vehicleType || undefined,
                vehicleNo: data.vehicleNo || undefined,
                licenseNo: data.licenseNo || undefined,
                bankName: data.bankName || undefined,
                accountNo: data.accountNo || undefined,
                ifscCode: data.ifscCode || undefined,
                upiId: data.upiId || undefined,
                status: data.status || undefined,
                isVerified: data.isVerified !== undefined ? data.isVerified : undefined,
            },
        });
        // Update User Data
        const userUpdateData = {};
        if (data.name && data.name !== partner.user.name)
            userUpdateData.name = data.name;
        if (data.email && data.email !== partner.user.email)
            userUpdateData.email = data.email;
        // Sanitize phone
        if (data.phone !== undefined) {
            const sanitizedPhone = data.phone === "" ? null : data.phone;
            if (sanitizedPhone !== partner.user.phone) {
                userUpdateData.phone = sanitizedPhone;
            }
        }
        if (data.isActive !== undefined && data.isActive !== partner.user.isActive) {
            userUpdateData.isActive = data.isActive;
        }
        if (data.isVerified === true && partner.user.role !== "DELIVERY") {
            userUpdateData.role = "DELIVERY";
        }
        if (Object.keys(userUpdateData).length > 0) {
            try {
                await prisma_1.prisma.user.update({
                    where: { id: partner.userId },
                    data: userUpdateData,
                });
            }
            catch (err) {
                if (err.code === "P2002") {
                    throw new errorHandler_1.AppError(`The ${err.meta?.target?.[0] || "field"} is already in use.`, 409);
                }
                throw err;
            }
        }
        res.json(updatedPartner);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.post("/delivery-partners/:id/payouts", async (req, res, next) => {
    try {
        const { amount, period, referenceId, status } = zod_1.z.object({
            amount: zod_1.z.union([zod_1.z.number(), zod_1.z.string().transform(v => Number(v.replace(/,/g, '')))]),
            period: zod_1.z.string(),
            referenceId: zod_1.z.string().optional().or(zod_1.z.literal("")),
            status: zod_1.z.string().default("PROCESSED"),
        }).parse(req.body);
        if (isNaN(amount))
            throw new errorHandler_1.AppError("Invalid amount format", 400);
        const payout = await prisma_1.prisma.payout.create({
            data: {
                deliveryPartnerId: req.params.id,
                amount,
                period,
                referenceId: referenceId || null,
                status,
                paidAt: status === "PROCESSED" ? new Date() : null,
            },
        });
        if (status === "PROCESSED") {
            await prisma_1.prisma.deliveryPartner.update({
                where: { id: req.params.id },
                data: { totalEarnings: { increment: amount } },
            });
        }
        res.status(201).json(payout);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.get("/delivery-partners/:id/payouts", async (req, res, next) => {
    try {
        const payouts = await prisma_1.prisma.payout.findMany({
            where: { deliveryPartnerId: req.params.id },
            orderBy: { createdAt: "desc" },
        });
        res.json(payouts);
    }
    catch (err) {
        next(err);
    }
});
exports.adminRouter.post("/delivery-partners/:id/reset-password", async (req, res, next) => {
    try {
        const { password } = zod_1.z.object({ password: zod_1.z.string().min(8) }).parse(req.body);
        const partner = await prisma_1.prisma.deliveryPartner.findUnique({ where: { id: req.params.id } });
        if (!partner)
            throw new errorHandler_1.AppError("Partner not found", 404);
        const hashedPassword = await bcryptjs_1.default.hash(password, 12);
        await prisma_1.prisma.user.update({
            where: { id: partner.userId },
            data: { password: hashedPassword },
        });
        res.json({ message: "Password reset successfully" });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=admin.js.map