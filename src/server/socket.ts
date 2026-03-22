import { Server as HttpServer } from "node:http";
import { Server as IOServer, Socket } from "socket.io";
import { SocketPayloadMap } from "@/src/types/flux";

type QueuedMessage = SocketPayloadMap["message:queue"];

const offlineQueue = new Map<string, QueuedMessage[]>();

const queueForUser = (userId: string, payload: QueuedMessage) => {
  const existing = offlineQueue.get(userId) ?? [];
  existing.push(payload);
  offlineQueue.set(userId, existing);
};

const flushQueue = (socket: Socket, userId: string) => {
  const queued = offlineQueue.get(userId) ?? [];
  queued.forEach((message) => socket.emit("message:sent", message));
  offlineQueue.delete(userId);
};

export const createSocketServer = (httpServer: HttpServer) => {
  const io = new IOServer(httpServer, {
    path: "/api/socket",
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth.userId as string | undefined;
    if (userId) {
      socket.join(userId);
      console.log(`[SOCKET] User ${userId} joined their own room`);
      flushQueue(socket, userId);
    }

    socket.on("user:online", ({ userId }) => {
      if (userId) {
        socket.join(userId);
      }
    });

    socket.on("chat:join", ({ chatId }) => {
      socket.join(chatId);
    });

    socket.on("chat:leave", ({ chatId }) => {
      socket.leave(chatId);
    });

    socket.on("presence:typing", (payload: SocketPayloadMap["presence:typing"]) => {
      socket.to(payload.chatId).emit("presence:typing", payload);
    });

    socket.on("message:queue", (payload: QueuedMessage) => {
      io.to(payload.chatId).emit("message:sent", { ...payload, status: "SENT" });
    });

    socket.on("message:delivered", (payload: SocketPayloadMap["message:delivered"]) => {
      socket.to(payload.chatId).emit("message:delivered", payload);
    });

    socket.on("message:read", (payload: SocketPayloadMap["message:read"]) => {
      socket.to(payload.chatId).emit("message:read", payload);
    });

    socket.on("message:reaction", (payload: SocketPayloadMap["message:reaction"]) => {
      socket.to(payload.messageId).emit("message:reaction", payload);
    });

    socket.on("call:offer", (payload: SocketPayloadMap["call:offer"]) => {
      if (payload.targetId) {
        console.log(`[CALL] Offer from ${payload.fromName} to user ${payload.targetId}`);
        io.to(payload.targetId).emit("call:offer", payload);
      } else {
        socket.to(payload.chatId).emit("call:offer", payload);
      }
    });
    socket.on("call:answer", (payload: SocketPayloadMap["call:answer"]) => {
      if (payload.targetId) {
        io.to(payload.targetId).emit("call:answer", payload);
      } else {
        socket.to(payload.chatId).emit("call:answer", payload);
      }
    });
    socket.on("call:ice", (payload: SocketPayloadMap["call:ice"]) => {
      if (payload.targetId) {
        io.to(payload.targetId).emit("call:ice", payload);
      } else {
        socket.to(payload.chatId).emit("call:ice", payload);
      }
    });
    socket.on("call:end", (payload: SocketPayloadMap["call:end"]) => {
      if (payload.targetId) {
        io.to(payload.targetId).emit("call:end", payload);
      } else {
        socket.to(payload.chatId).emit("call:end", payload);
      }
    });

    socket.on("offline:enqueue", ({ toUserId, payload }: { toUserId: string; payload: QueuedMessage }) => {
      queueForUser(toUserId, payload);
    });
  });

  return io;
};
