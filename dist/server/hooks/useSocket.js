"use client";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";
export const useSocket = (userId) => {
    const [socket, setSocket] = useState(null);
    const [connected, setConnected] = useState(false);
    useEffect(() => {
        if (!userId || userId === "u_me")
            return;
        // На Railway/Production используем относительный путь
        const s = io({
            path: "/api/socket",
            autoConnect: true,
            reconnection: true,
            reconnectionAttempts: 15,
            reconnectionDelay: 2000,
            transports: ["polling", "websocket"], // Разрешаем polling как fallback
            auth: { userId },
        });
        s.on("connect", () => {
            setConnected(true);
            setSocket(s);
            console.log(`> Socket connected! (ID: ${s.id}, UserID: ${userId})`);
            // Сразу сообщаем серверу, что мы онлайн
            s.emit("user:online", { userId });
            // Запускаем сердцебиение
            const heartbeat = setInterval(() => {
                if (s.connected) {
                    s.emit("heartbeat");
                }
            }, 10000); // каждые 10 секунд
            s.on("heartbeat:ack", () => {
                // Сервер подтвердил статус
            });
            return () => {
                clearInterval(heartbeat);
            };
        });
        s.on("disconnect", () => {
            setConnected(false);
            console.log("> Disconnected from Socket.io server");
        });
        return () => {
            s.disconnect();
        };
    }, [userId]);
    return { socket, connected, queuedCount: 0 };
};
