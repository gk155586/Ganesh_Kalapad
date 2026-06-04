"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cartRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
const products_1 = require("./products");
exports.cartRouter = (0, express_1.Router)();
exports.cartRouter.use(auth_1.authenticate);
// GET /api/cart
exports.cartRouter.get("/", async (req, res, next) => {
    try {
        const cart = await prisma_1.prisma.cart.findUnique({
            where: { userId: req.user.userId },
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
            const newCart = await prisma_1.prisma.cart.create({
                data: { userId: req.user.userId },
                include: { items: true },
            });
            return res.json({ ...newCart, summary: { subtotal: 0, itemCount: 0 } });
        }
        const subtotal = cart.items.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
        const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        const formattedCart = {
            ...cart,
            items: cart.items.map(item => ({
                ...item,
                product: (0, products_1.formatProduct)(item.product)
            })),
            summary: { subtotal, itemCount }
        };
        res.json(formattedCart);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/cart/add
exports.cartRouter.post("/add", async (req, res, next) => {
    try {
        const { productId, quantity } = zod_1.z.object({
            productId: zod_1.z.string(),
            quantity: zod_1.z.number().int().positive().default(1),
        }).parse(req.body);
        // Verify product exists and has stock
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId, isActive: true },
            include: { inventory: true },
        });
        if (!product)
            throw new errorHandler_1.AppError("Product not found", 404);
        if (!product.inventory || product.inventory.stock < quantity) {
            throw new errorHandler_1.AppError("Insufficient stock", 400);
        }
        let cart = await prisma_1.prisma.cart.findUnique({ where: { userId: req.user.userId } });
        if (!cart) {
            cart = await prisma_1.prisma.cart.create({ data: { userId: req.user.userId } });
        }
        const existingItem = await prisma_1.prisma.cartItem.findUnique({
            where: { cartId_productId: { cartId: cart.id, productId } },
        });
        let item;
        if (existingItem) {
            const newQty = existingItem.quantity + quantity;
            if (product.inventory.stock < newQty)
                throw new errorHandler_1.AppError("Insufficient stock", 400);
            item = await prisma_1.prisma.cartItem.update({
                where: { id: existingItem.id },
                data: { quantity: newQty },
                include: { product: true },
            });
        }
        else {
            item = await prisma_1.prisma.cartItem.create({
                data: { cartId: cart.id, productId, quantity },
                include: { product: true },
            });
        }
        res.json({
            ...item,
            product: (0, products_1.formatProduct)(item?.product)
        });
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/cart/update
exports.cartRouter.put("/update", async (req, res, next) => {
    try {
        const { productId, quantity } = zod_1.z.object({
            productId: zod_1.z.string().cuid(),
            quantity: zod_1.z.number().int().min(0),
        }).parse(req.body);
        const cart = await prisma_1.prisma.cart.findUnique({ where: { userId: req.user.userId } });
        if (!cart)
            throw new errorHandler_1.AppError("Cart not found", 404);
        if (quantity === 0) {
            await prisma_1.prisma.cartItem.deleteMany({
                where: { cartId: cart.id, productId },
            });
            return res.json({ message: "Item removed" });
        }
        const product = await prisma_1.prisma.product.findUnique({
            where: { id: productId },
            include: { inventory: true },
        });
        if (!product?.inventory || product.inventory.stock < quantity) {
            throw new errorHandler_1.AppError("Insufficient stock", 400);
        }
        const item = await prisma_1.prisma.cartItem.upsert({
            where: { cartId_productId: { cartId: cart.id, productId } },
            update: { quantity },
            create: { cartId: cart.id, productId, quantity },
            include: { product: true },
        });
        res.json({
            ...item,
            product: (0, products_1.formatProduct)(item.product)
        });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/cart/remove/:productId
exports.cartRouter.delete("/remove/:productId", async (req, res, next) => {
    try {
        const cart = await prisma_1.prisma.cart.findUnique({ where: { userId: req.user.userId } });
        if (!cart)
            throw new errorHandler_1.AppError("Cart not found", 404);
        await prisma_1.prisma.cartItem.deleteMany({
            where: { cartId: cart.id, productId: req.params.productId },
        });
        res.json({ message: "Item removed from cart" });
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/cart/clear
exports.cartRouter.delete("/clear", async (req, res, next) => {
    try {
        const cart = await prisma_1.prisma.cart.findUnique({ where: { userId: req.user.userId } });
        if (!cart)
            throw new errorHandler_1.AppError("Cart not found", 404);
        await prisma_1.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
        res.json({ message: "Cart cleared" });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=cart.js.map