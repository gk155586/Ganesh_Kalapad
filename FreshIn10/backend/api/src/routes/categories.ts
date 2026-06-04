import { Router } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../middleware/errorHandler";

export const categoryRouter = Router();

// GET /api/categories
categoryRouter.get("/", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
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
  } catch (err) {
    next(err);
  }
});

// GET /api/categories/:slug
categoryRouter.get("/:slug", async (req, res, next) => {
  try {
    const category = await prisma.category.findFirst({
      where: {
        OR: [{ id: req.params.slug }, { slug: req.params.slug }],
        isActive: true,
      },
      include: {
        children: { where: { isActive: true } },
        _count: { select: { products: { where: { isActive: true } } } },
      },
    });

    if (!category) throw new AppError("Category not found", 404);
    res.json(category);
  } catch (err) {
    next(err);
  }
});
