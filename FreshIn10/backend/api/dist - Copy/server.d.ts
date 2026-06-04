import "dotenv/config";
import { Server as SocketServer } from "socket.io";
declare const app: import("express-serve-static-core").Express;
export declare const io: SocketServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export default app;
//# sourceMappingURL=server.d.ts.map