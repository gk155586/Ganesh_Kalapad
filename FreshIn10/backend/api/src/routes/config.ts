import { Router } from "express";
import { prisma } from "../lib/prisma";

export const configRouter = Router();

configRouter.get("/", async (_req, res, next) => {
  try {
    let config = await prisma.appConfig.findUnique({ where: { id: "global" } });
    if (!config) {
      config = await prisma.appConfig.create({
        data: { 
          id: "global",
          groceries: JSON.stringify({
            primaryColor: "#16a34a",
            layout: [
              { id: "hero", type: "Hero", title: "Groceries at your door in 10 minutes", subtitle: "Fresh vegetables, fruits, dairy & more." },
              { id: "categories", type: "Categories", title: "Shop by Category" },
              { id: "banners", type: "Banners", title: "Special Offers" },
              { id: "trending", type: "Trending", title: "Trending Products" },
              { id: "whyus", type: "WhyUs", title: "Why FreshIn10?" },
            ],
            banners: [
              { id: "1", title: "Fresh Vegetables", subtitle: "Up to 40% off", color: "#16a34a", image: "" },
              { id: "2", title: "Dairy & Eggs", subtitle: "Free delivery today", color: "#3b82f6", image: "" }
            ]
          }),
          delivery: JSON.stringify({ primaryColor: "#3b82f6", theme: "black" })
        }
      });
    }

    res.json({
      ...config,
      groceries: JSON.parse(config.groceries),
      delivery: JSON.parse(config.delivery)
    });
  } catch (err) {
    // Return fallback if database table not ready
    res.json({
      id: "global",
      appName: "FreshIn10",
      groceries: {
        primaryColor: "#16a34a",
        layout: [
          { id: "hero", type: "Hero", title: "Groceries at your door in 10 minutes", subtitle: "Fresh vegetables, fruits, dairy & more." },
          { id: "categories", type: "Categories", title: "Shop by Category" },
          { id: "banners", type: "Banners", title: "Special Offers" },
          { id: "trending", type: "Trending", title: "Trending Products" },
          { id: "whyus", type: "WhyUs", title: "Why FreshIn10?" },
        ],
        banners: []
      },
      delivery: { primaryColor: "#3b82f6", theme: "black" },
      updatedAt: new Date()
    });
  }
});
