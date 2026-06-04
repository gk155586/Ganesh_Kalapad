import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export const productRouter = Router();

// Helper to format product fields
export function formatProduct(product: any) {
  if (!product) return product;
  try {
    const formatted = {
      ...product,
      images: typeof product.images === "string" ? JSON.parse(product.images) : product.images,
      tags: typeof product.tags === "string" ? JSON.parse(product.tags) : product.tags,
    };

    if (formatted.reviews) {
      formatted.reviews = formatted.reviews.map((r: any) => ({
        ...r,
        images: typeof r.images === "string" ? JSON.parse(r.images) : r.images,
      }));
    }

    return formatted;
  } catch {
    return product;
  }
}

// GET /api/products - list with filters
productRouter.get("/", async (req, res, next) => {
  try {
    const query = z.object({
      page: z.coerce.number().default(1),
      limit: z.coerce.number().max(100).default(20),
      category: z.string().optional(),
      search: z.string().optional(),
      minPrice: z.coerce.number().optional(),
      maxPrice: z.coerce.number().optional(),
      sort: z.enum(["price_asc", "price_desc", "newest", "popular", "rating"]).default("newest"),
      featured: z.coerce.boolean().optional(),
      trending: z.coerce.boolean().optional(),
    }).parse(req.query);

    const skip = (query.page - 1) * query.limit;

    const where: any = { isActive: true };

    if (query.category) {
      const cat = await prisma.category.findFirst({
        where: { OR: [{ id: query.category }, { slug: query.category }] },
      });
      if (cat) where.categoryId = cat.id;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: "insensitive" } },
        { description: { contains: query.search, mode: "insensitive" } },
        { tags: { contains: query.search.toLowerCase() } },
      ];
    }

    if (query.minPrice !== undefined) where.price = { ...where.price, gte: query.minPrice };
    if (query.maxPrice !== undefined) where.price = { ...where.price, lte: query.maxPrice };
    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.trending !== undefined) where.isTrending = query.trending;

    const orderBy: any = {
      price_asc: { price: "asc" },
      price_desc: { price: "desc" },
      newest: { createdAt: "desc" },
      popular: { soldCount: "desc" },
      rating: { rating: "desc" },
    }[query.sort];

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          inventory: { select: { stock: true } },
        },
      }),
      prisma.product.count({ where }),
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
  } catch (err) {
    res.status(500).json({ error: (err as any).message, stack: (err as any).stack });
  }
});

// GET /api/products/search - autocomplete
productRouter.get("/search", async (req, res, next) => {
  try {
    const { q } = z.object({ q: z.string().min(1) }).parse(req.query);

    const products = await prisma.product.findMany({
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
  } catch (err) {
    next(err);
  }
});

// GET /api/products/featured
productRouter.get("/featured", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      take: 12,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        inventory: { select: { stock: true } },
      },
      orderBy: { soldCount: "desc" },
    });
    res.json(products.map(formatProduct));
  } catch (err) {
    next(err);
  }
});

// GET /api/products/trending
productRouter.get("/trending", async (_req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, isTrending: true },
      take: 12,
      include: {
        category: { select: { id: true, name: true, slug: true } },
        inventory: { select: { stock: true } },
      },
      orderBy: { soldCount: "desc" },
    });
    res.json(products.map(formatProduct));
  } catch (err) {
    next(err);
  }
});

// GET /api/products/:id
productRouter.get("/:id", async (req, res, next) => {
  try {
    const product = await prisma.product.findFirst({
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

    if (!product) throw new AppError("Product not found", 404);

    // Get similar products
    const similar = await prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        isActive: true,
        id: { not: product.id },
      },
      take: 6,
      include: { inventory: { select: { stock: true } } },
    });

    res.json({ ...formatProduct(product), similar: similar.map(formatProduct) });
  } catch (err) {
    next(err);
  }
});
