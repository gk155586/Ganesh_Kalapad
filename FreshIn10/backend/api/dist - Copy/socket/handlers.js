"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = setupSocketHandlers;
const jwt_1 = require("../lib/jwt");
const prisma_1 = require("../lib/prisma");
function setupSocketHandlers(io) {
    // Auth middleware for socket
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;
            if (!token) {
                // Allow unauthenticated connections for public rooms
                return next();
            }
            const payload = (0, jwt_1.verifyAccessToken)(token);
            socket.user = payload;
            next();
        }
        catch {
            next(new Error("Authentication failed"));
        }
    });
    io.on("connection", (socket) => {
        const user = socket.user;
        if (user) {
            // Join user-specific room
            socket.join(`user:${user.userId}`);
            // Admin joins admin room
            if (user.role === "ADMIN") {
                socket.join("admin");
            }
            // Delivery partner joins delivery room
            if (user.role === "DELIVERY") {
                socket.join("delivery");
            }
            console.log(`[Socket] User ${user.userId} connected (${user.role})`);
        }
        // Track delivery partner location
        socket.on("delivery:location", async (data) => {
            if (!user || user.role !== "DELIVERY")
                return;
            await prisma_1.prisma.deliveryPartner.update({
                where: { userId: user.userId },
                data: { latitude: data.latitude, longitude: data.longitude },
            }).catch(() => { });
            // Broadcast to admin
            io.to("admin").emit("delivery:location", {
                partnerId: user.userId,
                ...data,
            });
        });
        // Order tracking subscription
        socket.on("order:subscribe", (orderId) => {
            socket.join(`order:${orderId}`);
        });
        socket.on("order:unsubscribe", (orderId) => {
            socket.leave(`order:${orderId}`);
        });
        socket.on("disconnect", () => {
            if (user) {
                console.log(`[Socket] User ${user.userId} disconnected`);
            }
        });
    });
}
//# sourceMappingURL=handlers.js.map