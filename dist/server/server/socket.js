import { Server as IOServer } from "socket.io";
const offlineQueue = new Map();
const queueForUser = (userId, payload) => {
    const existing = offlineQueue.get(userId) ?? [];
    existing.push(payload);
    offlineQueue.set(userId, existing);
};
const flushQueue = (socket, userId) => {
    const queued = offlineQueue.get(userId) ?? [];
    queued.forEach((message) => socket.emit("new_message", message));
    offlineQueue.delete(userId);
};
export const createSocketServer = (httpServer) => {
    const io = new IOServer(httpServer, {
        path: "/api/socket",
        cors: {
            origin: "*",
            methods: ["GET", "POST"],
        },
    });
    const onlineUsers = new Map(); // userId -> count of sockets
    const broadcastOnlineUsers = () => {
        io.emit("users:online", Array.from(onlineUsers.keys()));
    };
    io.on("connection", (socket) => {
        const userId = socket.handshake.auth.userId;
        if (userId) {
            socket.join(userId);
            console.log(`[SOCKET] User ${userId} joined their own room`);
            // Update online users
            const current = onlineUsers.get(userId) || 0;
            onlineUsers.set(userId, current + 1);
            broadcastOnlineUsers();
            flushQueue(socket, userId);
        }
        socket.on("user:online", ({ userId: uid }) => {
            if (uid) {
                socket.join(uid);
                if (!onlineUsers.has(uid)) {
                    onlineUsers.set(uid, 1);
                    broadcastOnlineUsers();
                }
            }
        });
        socket.on("presence:typing", (payload) => {
            socket.to(payload.chatId).emit("presence:typing", payload);
        });
        socket.on("message:reaction", (payload) => {
            socket.to(payload.chatId).emit("message:reaction", payload);
        });
        socket.on("message:delete", (payload) => {
            socket.to(payload.chatId).emit("message:delete", payload);
        });
        socket.on("chat:join", ({ chatId }) => {
            socket.join(chatId);
        });
        socket.on("chat:leave", ({ chatId }) => {
            socket.leave(chatId);
        });
        socket.on("presence:typing", (payload) => {
            socket.to(payload.chatId).emit("presence:typing", payload);
        });
        socket.on("message:queue", (payload) => {
            console.log(`[SOCKET] New message from ${payload.senderName} to chat ${payload.chatId}`);
            // Отправляем всем участникам комнаты чата
            io.to(payload.chatId).emit("new_message", { ...payload, status: "SENT" });
        });
        socket.on("message:delivered", (payload) => {
            socket.to(payload.chatId).emit("message:delivered", payload);
        });
        socket.on("message:read", (payload) => {
            socket.to(payload.chatId).emit("message:read", payload);
        });
        socket.on("message:reaction", (payload) => {
            console.log(`[SOCKET] Reaction ${payload.emoji} from ${payload.userId} to message ${payload.messageId}`);
            socket.to(payload.chatId).emit("message:reaction", payload);
        });
        socket.on("call:offer", (payload) => {
            if (payload.targetId) {
                console.log(`[CALL] Offer from ${payload.fromName} to user ${payload.targetId}`);
                io.to(payload.targetId).emit("call:offer", payload);
            }
            else {
                socket.to(payload.chatId).emit("call:offer", payload);
            }
        });
        socket.on("call:answer", (payload) => {
            if (payload.targetId) {
                io.to(payload.targetId).emit("call:answer", payload);
            }
            else {
                socket.to(payload.chatId).emit("call:answer", payload);
            }
        });
        socket.on("call:ice", (payload) => {
            if (payload.targetId) {
                io.to(payload.targetId).emit("call:ice", payload);
            }
            else {
                socket.to(payload.chatId).emit("call:ice", payload);
            }
        });
        socket.on("call:end", (payload) => {
            if (payload.targetId) {
                io.to(payload.targetId).emit("call:end", payload);
            }
            else {
                socket.to(payload.chatId).emit("call:end", payload);
            }
        });
        socket.on("offline:enqueue", ({ toUserId, payload }) => {
            queueForUser(toUserId, payload);
        });
        socket.on("disconnect", () => {
            if (userId) {
                const count = onlineUsers.get(userId) || 0;
                if (count <= 1) {
                    onlineUsers.delete(userId);
                }
                else {
                    onlineUsers.set(userId, count - 1);
                }
                broadcastOnlineUsers();
                console.log(`[SOCKET] User ${userId} disconnected. Remaining: ${onlineUsers.size}`);
            }
        });
    });
    return io;
};
