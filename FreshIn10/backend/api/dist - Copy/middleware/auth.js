"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireDelivery = exports.requireAdmin = void 0;
exports.authenticate = authenticate;
exports.requireRole = requireRole;
const jwt_1 = require("../lib/jwt");
const prisma_1 = require("../lib/prisma");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            return res.status(401).json({ error: "No token provided" });
        }
        const token = authHeader.split(" ")[1];
        const payload = (0, jwt_1.verifyAccessToken)(token);
        // Verify user still exists and is active
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, isActive: true },
        });
        if (!user || !user.isActive) {
            return res.status(401).json({ error: "User not found or inactive" });
        }
        req.user = payload;
        next();
    }
    catch {
        return res.status(401).json({ error: "Invalid or expired token" });
    }
}
function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: "Not authenticated" });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
    };
}
exports.requireAdmin = requireRole("ADMIN");
exports.requireDelivery = requireRole("DELIVERY", "ADMIN");
//# sourceMappingURL=auth.js.map