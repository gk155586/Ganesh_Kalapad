import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../lib/jwt";
import { prisma } from "../lib/prisma";

export function setupSocketHandlers(io: Server) {
  // Auth middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        // Allow unauthenticated connections for public rooms
        return next();
      }
      const payload = verifyAccessToken(token);
      (socket as any).user = payload;
      next();
    } catch {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;

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
    socket.on("delivery:location", async (data: { latitude: number; longitude: number }) => {
      if (!user || user.role !== "DELIVERY") return;

      await prisma.deliveryPartner.update({
        where: { userId: user.userId },
        data: { latitude: data.latitude, longitude: data.longitude },
      }).catch(() => {});

      // Broadcast to admin
      io.to("admin").emit("delivery:location", {
        partnerId: user.userId,
        ...data,
      });

      // Also broadcast to any active order rooms for this partner
      const activeOrders = await prisma.order.findMany({
        where: {
          deliveryPartnerId: (user as any).partnerId || user.userId, // partnerId logic
          status: { in: ["PICKED_UP", "OUT_FOR_DELIVERY"] }
        },
        select: { id: true }
      });

      for (const order of activeOrders) {
        io.to(`order:${order.id}`).emit("order:location", data);
      }
    });

    // Order tracking subscription
    socket.on("order:subscribe", (orderId: string) => {
      socket.join(`order:${orderId}`);
    });

    socket.on("order:unsubscribe", (orderId: string) => {
      socket.leave(`order:${orderId}`);
    });

    socket.on("disconnect", () => {
      if (user) {
        console.log(`[Socket] User ${user.userId} disconnected`);
      }
    });
  });
}
