"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wishlistRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const products_1 = require("./products");
exports.wishlistRouter = (0, express_1.Router)();
exports.wishlistRouter.use(auth_1.authenticate);
exports.wishlistRouter.get("/", async (req, res, next) => {
    try {
        const wishlist = await prisma_1.prisma.wishlist.findMany({
            where: { userId: req.user.userId },
            include: {
                product: {
                    include: { inventory: { select: { stock: true } } },
                },
            },
            orderBy: { createdAt: "desc" },
        });
        res.json(wishlist.map(item => ({
            ...item,
            product: (0, products_1.formatProduct)(item.product)
        })));
    }
    catch (err) {
        next(err);
    }
});
exports.wishlistRouter.post("/toggle", async (req, res, next) => {
    try {
        const { productId } = zod_1.z.object({ productId: zod_1.z.string() }).parse(req.body);
        const existing = await prisma_1.prisma.wishlist.findUnique({
            where: { userId_productId: { userId: req.user.userId, productId } },
        });
        if (existing) {
            await prisma_1.prisma.wishlist.delete({ where: { id: existing.id } });
            return res.json({ wishlisted: false });
        }
        await prisma_1.prisma.wishlist.create({
            data: { userId: req.user.userId, productId },
        });
        res.json({ wishlisted: true });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=wishlist.js.map