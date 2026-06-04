"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
function errorHandler(err, _req, res, _next) {
    console.error("[Error]", err);
    // Zod validation errors
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({
            error: "Validation failed",
            details: err.errors.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            })),
        });
    }
    // Prisma errors
    if (err instanceof client_1.Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            const target = err.meta?.target?.join(", ") || "field";
            return res.status(409).json({
                error: `Resource already exists: A record with this ${target} already exists.`
            });
        }
        if (err.code === "P2025") {
            return res.status(404).json({ error: "Resource not found" });
        }
    }
    // Custom app errors
    if (err.statusCode) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    // Default
    return res.status(500).json({
        error: process.env.NODE_ENV === "production"
            ? "Internal server error"
            : err.message,
    });
}
class AppError extends Error {
    constructor(message, statusCode = 500) {
        super(message);
        this.statusCode = statusCode;
        this.name = "AppError";
    }
}
exports.AppError = AppError;
//# sourceMappingURL=errorHandler.js.map