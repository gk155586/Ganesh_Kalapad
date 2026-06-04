"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.categoryRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
exports.categoryRouter = (0, express_1.Router)();
// GET /api/categories
exports.categoryRouter.get("/", async (_req, res, next) => {
    try {
        const categories = await prisma_1.prisma.category.findMany({
            where: { isActive: true, parentId: null },
            orderBy: { sortOrder: "asc" },
            include: {
                children: {
                    where: { isActive: true },
                    orderBy: { sortOrder: "asc" },
                },
                _count: { select: { products: { where: { isActive: true } } } },
            },
        });
        res.json(categories);
    }
    catch (err) {
        next(err);
    }
});
// GET /api/categories/:slug
exports.categoryRouter.get("/:slug", async (req, res, next) => {
    try {
        const category = await prisma_1.prisma.category.findFirst({
            where: {
                OR: [{ id: req.params.slug }, { slug: req.params.slug }],
                isActive: true,
            },
            include: {
                children: { where: { isActive: true } },
                _count: { select: { products: { where: { isActive: true } } } },
            },
        });
        if (!category)
            throw new errorHandler_1.AppError("Category not found", 404);
        res.json(category);
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=categories.js.map