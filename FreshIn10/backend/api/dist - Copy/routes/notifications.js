"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationRouter = void 0;
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
exports.notificationRouter = (0, express_1.Router)();
exports.notificationRouter.use(auth_1.authenticate);
exports.notificationRouter.get("/", async (req, res, next) => {
    try {
        const notifications = await prisma_1.prisma.notification.findMany({
            where: { userId: req.user.userId },
            orderBy: { createdAt: "desc" },
            take: 50,
        });
        const unreadCount = await prisma_1.prisma.notification.count({
            where: { userId: req.user.userId, isRead: false },
        });
        res.json({ notifications, unreadCount });
    }
    catch (err) {
        next(err);
    }
});
exports.notificationRouter.put("/read-all", async (req, res, next) => {
    try {
        await prisma_1.prisma.notification.updateMany({
            where: { userId: req.user.userId, isRead: false },
            data: { isRead: true },
        });
        res.json({ message: "All notifications marked as read" });
    }
    catch (err) {
        next(err);
    }
});
exports.notificationRouter.put("/:id/read", async (req, res, next) => {
    try {
        await prisma_1.prisma.notification.updateMany({
            where: { id: req.params.id, userId: req.user.userId },
            data: { isRead: true },
        });
        res.json({ message: "Notification marked as read" });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=notifications.js.map