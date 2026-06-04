"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
// Prevent multiple instances in development
exports.prisma = global.__prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});
if (process.env.NODE_ENV !== "production") {
    global.__prisma = exports.prisma;
}
//# sourceMappingURL=prisma.js.map