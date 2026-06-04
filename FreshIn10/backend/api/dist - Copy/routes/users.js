"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRouter = void 0;
const express_1 = require("express");
const zod_1 = require("zod");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const errorHandler_1 = require("../middleware/errorHandler");
exports.userRouter = (0, express_1.Router)();
exports.userRouter.use(auth_1.authenticate);
// PUT /api/users/profile
exports.userRouter.put("/profile", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            name: zod_1.z.string().min(2).optional(),
            phone: zod_1.z.string().regex(/^[6-9]\d{9}$/).optional(),
            avatar: zod_1.z.string().url().optional(),
        });
        const data = schema.parse(req.body);
        const user = await prisma_1.prisma.user.update({
            where: { id: req.user.userId },
            data,
            select: { id: true, name: true, email: true, phone: true, avatar: true, walletBalance: true },
        });
        res.json(user);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/users/password
exports.userRouter.put("/password", async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = zod_1.z.object({
            currentPassword: zod_1.z.string(),
            newPassword: zod_1.z.string().min(8),
        }).parse(req.body);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { password: true },
        });
        if (!user?.password)
            throw new errorHandler_1.AppError("No password set", 400);
        const valid = await bcryptjs_1.default.compare(currentPassword, user.password);
        if (!valid)
            throw new errorHandler_1.AppError("Current password is incorrect", 400);
        const hashed = await bcryptjs_1.default.hash(newPassword, 12);
        await prisma_1.prisma.user.update({
            where: { id: req.user.userId },
            data: { password: hashed },
        });
        res.json({ message: "Password updated successfully" });
    }
    catch (err) {
        next(err);
    }
});
// GET /api/users/addresses
exports.userRouter.get("/addresses", async (req, res, next) => {
    try {
        const addresses = await prisma_1.prisma.address.findMany({
            where: { userId: req.user.userId },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        });
        res.json(addresses);
    }
    catch (err) {
        next(err);
    }
});
// POST /api/users/addresses
exports.userRouter.post("/addresses", async (req, res, next) => {
    try {
        const schema = zod_1.z.object({
            label: zod_1.z.enum(["HOME", "WORK", "OTHER"]).default("HOME"),
            fullName: zod_1.z.string().min(2),
            phone: zod_1.z.string().regex(/^[6-9]\d{9}$/),
            addressLine1: zod_1.z.string().min(5),
            addressLine2: zod_1.z.string().optional(),
            city: zod_1.z.string().min(2),
            state: zod_1.z.string().min(2),
            pincode: zod_1.z.string().regex(/^\d{6}$/),
            landmark: zod_1.z.string().optional(),
            latitude: zod_1.z.number().optional(),
            longitude: zod_1.z.number().optional(),
            isDefault: zod_1.z.boolean().default(false),
        });
        const data = schema.parse(req.body);
        if (data.isDefault) {
            await prisma_1.prisma.address.updateMany({
                where: { userId: req.user.userId },
                data: { isDefault: false },
            });
        }
        const address = await prisma_1.prisma.address.create({
            data: { ...data, userId: req.user.userId, label: data.label },
        });
        res.status(201).json(address);
    }
    catch (err) {
        next(err);
    }
});
// PUT /api/users/addresses/:id
exports.userRouter.put("/addresses/:id", async (req, res, next) => {
    try {
        const existing = await prisma_1.prisma.address.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
        });
        if (!existing)
            throw new errorHandler_1.AppError("Address not found", 404);
        const data = req.body;
        if (data.isDefault) {
            await prisma_1.prisma.address.updateMany({
                where: { userId: req.user.userId },
                data: { isDefault: false },
            });
        }
        const address = await prisma_1.prisma.address.update({
            where: { id: req.params.id },
            data,
        });
        res.json(address);
    }
    catch (err) {
        next(err);
    }
});
// DELETE /api/users/addresses/:id
exports.userRouter.delete("/addresses/:id", async (req, res, next) => {
    try {
        const existing = await prisma_1.prisma.address.findFirst({
            where: { id: req.params.id, userId: req.user.userId },
        });
        if (!existing)
            throw new errorHandler_1.AppError("Address not found", 404);
        await prisma_1.prisma.address.delete({ where: { id: req.params.id } });
        res.json({ message: "Address deleted" });
    }
    catch (err) {
        next(err);
    }
});
//# sourceMappingURL=users.js.map