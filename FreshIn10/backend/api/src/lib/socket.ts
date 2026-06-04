import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketServer | null = null;

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: [
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        process.env.NEXT_PUBLIC_ADMIN_URL || "http://localhost:3001",
        process.env.NEXT_PUBLIC_DELIVERY_URL || "http://localhost:3002",
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });
  return io;
}

export function getIO() {
  if (!io) {
    // Return a dummy object to avoid crashes during initialization
    return {
      to: () => ({ emit: () => {} }),
      emit: () => {},
    } as any;
  }
  return io;
}
