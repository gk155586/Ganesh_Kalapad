import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authenticate, AuthRequest } from "../middleware/auth";

export const notificationRouter = Router();

notificationRouter.use(authenticate);

notificationRouter.get("/", async (req: AuthRequest, res, next) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
    const unreadCount = await prisma.notification.count({
      where: { userId: req.user!.userId, isRead: false },
    });
    res.json({ notifications, unreadCount });
  } catch (err) {
    next(err);
  }
});

notificationRouter.put("/read-all", async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user!.userId, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "All notifications marked as read" });
  } catch (err) {
    next(err);
  }
});

notificationRouter.put("/:id/read", async (req: AuthRequest, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user!.userId },
      data: { isRead: true },
    });
    res.json({ message: "Notification marked as read" });
  } catch (err) {
    next(err);
  }
});
