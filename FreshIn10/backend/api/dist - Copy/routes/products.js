"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.productRouter = void 0;
exports.formatProduct = formatProduct;
const express_1 = require("express");
const zod_1 = require("zod");
const prisma_1 = require("../lib/prisma");
const errorHandler_1 = require("../middleware/errorHandler");
exports.productRouter = (0, express_1.Router)();
// Helper to format product fields
function formatProduct(product) {
    if (!product)
        return product;
    try {
        const formatted = {
            ...product,
            images: typeof product.images === "string" ? JSON.parse(product.images) : product.images,
            tags: typeof product.tags === "string" ? JSON.parse(product.tags) : product.tags,
        };
        if (formatted.reviews) {
            formatted.reviews = formatted.reviews.map((r) => ({
                ...r,
                images: typeof r.images === "string" ? JSON.parse(r.images) : r.images,
            }));
        }
        return formatted;
    }
    catch {
        return product;
    }
}
// GET /api/products - list with filters
exports.productRouter.get("/", async (req, res, next) => {
    try {
        const query = zod_1.z.object({
            page: zod_1.z.coerce.number().default(1),
            limit: zod_1.z.coerce.number().max(100).default(20),
            category: zod_1.z.string().optional(),
            search: zod_1.z.string().optional(),
            minPrice: zod_1.z.coerce.number().optional(),
            maxPrice: zod_1.z.coerce.number().optional(),
            sort: zod_1.z.enum(["price_asc", "price_desc", "newest", "popular", "rating"]).default("newest"),
            featured: zod_1.z.coerce.boolean().optional(),
            trending: zod_1.z.coerce.boolean().optional(),
        }).parse(req.query);
        const skip = (query.page - 1) * query.limit;
        const where = { isActive: true };
        if (query.category) {
            const cat = await prisma_1.prisma.category.findFirst({
                where: { OR: [{ id: query.category }, { slug: query.category }] },
            });
            if (cat)
                where.categoryId = cat.id;
        }
        if (query.search) {
            where.OR = [
                { name: { contains: query.search, mode: "insensitive" } },
                { description: { contains: query.search, mode: "insensitive" } },
                { tags: { contains: query.search.toLowerCase() } },
            ];
        }
        if (query.minPrice !== undefined)
            where.price = { ...where.price, gte: query.minPrice };
        if (query.maxPrice !== undefined)
            where.price = { ...where.price, lte: query.maxPrice };
        if (query.featured !== undefined)
            where.isFeatured = query.featured;
        if (query.trending !== undefined)
            where.isTrending = query.trending;
        const orderBy = {
            price_asc: { price: "asc" },
            price_desc: { price: "desc" },
            newest: { createdAt: "desc" },
            popular: { soldCount: "desc" },
            rating: { rating: "desc" },
        }[query.sort];
        const [products, total] = await Promise.all([
            prisma_1.prisma.product.findMany({
                where,
                orderBy,
                skip,
                take: query.limit,
                include: {
                    category: { select: { id: true, name: true, slug: true } },
                    inventory: { select: { stock: true } },
                },
            }),
            prisma_1.prisma.product.count({ where }),
        ]);
        res.json({
            products: products.map(formatProduct),
            pagination: {
                page: query.page,
                limit: query.limit,
                total,
                pages: Math.ceil(total / query.limit),
            },
        });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/products/search - autocomplete
exports.productRouter.get("/search", async (req, res, next) => {
    try {
        const { q } = zod_1.z.object({ q: zod_1.z.string().min(1) }).parse(req.query);
        const products = await prisma_1.prisma.product.findMany({
            where: {
                isActive: true,
                OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { tags: { contains: q.toLowerCase() } },
                ],
            },
            take: 8,
            select: {
                id: true, name: true, price: true, images: true, slug: true,
                category: { select: { name: true } },
            },
        });
        res.json(products.map(formatProduct));
    }
    catch (err) {
        next(err);
    }
});
// GET /api/products/featured
exports.productRouter.get("/featured", async (_req, res, next) => {
    try {
        const products = await prisma_1.prisma.product.findMany({
            where: { isActive: true, isFeatured: true },
            take: 12,
            include: {
                category: { select: { id: true, name: true, slug: true } },
                inventory: { select: { stock: true } },
            },
            orderBy: { soldCount: "desc" },
        });
        res.json(products.map(formatProduct));
    }
    catch (err) {
        next(err);
    }
});
// GET /api/products/trending
exports.productRouter.get("/trending", async (_req, res, next) => {
    try {
        const products = await prisma_1.prisma.product.findMany({
            where: { isActive: true, isTrending: true },
            take: 12,
            include: {
                category: { select: { id: true, name: true, slug: true } },
                inventory: { select: { stock: true } },
            },
            orderBy: { soldCount: "desc" },
        });
        res.json(products.map(formatProduct));
    }
    catch (err) {
        next(err);
    }
});
// GET /api/products/:id
exports.productRouter.get("/:id", async (req, res, next) => {
    try {
        const product = await prisma_1.prisma.product.findFirst({
            where: {
                OR: [{ id: req.params.id }, { slug: req.params.id }],
                isActive: true,
            },
            include: {
                category: true,
                inventory: true,
                reviews: {
                    where: { isActive: true },
                    take: 10,
                    orderBy: { createdAt: "desc" },
                    include: { user: { select: { name: true, avatar: true } } },
                },
            },
        });
        if (!product)
            throw new errorHandler_1.AppError("Product not found", 404);
        // Get similar products
        const similar = await prisma_1.prisma.product.findMany({
            where: {
                categoryId: product.categoryId,
                isActive: true,
                id: { not: product.id },
            },
            take: 6,
            include: { inventory: { select: { stock: true } } },
        });
        res.json({ ...formatProduct(product), similar: similar.map(formatProduct) });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=products.js.map