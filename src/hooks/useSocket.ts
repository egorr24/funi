"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { FluxMessage, SocketPayloadMap } from "@/src/types/flux";

type OutboundEvent = keyof SocketPayloadMap;

export const useSocket = (userId: string) => {
  const [connected, setConnected] = useState(false);
  const [queue, setQueue] = useState<FluxMessage[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // В продакшене используем относительный путь для Railway
    const socketUrl = process.env.NODE_ENV === "production" 
      ? undefined // Означает текущий хост
      : "http://localhost:3000";

    const socket = io(socketUrl, {
      path: "/api/socket",
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ["polling", "websocket"], // Сначала polling для надежности
      auth: { userId },
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      setQueue((pending) => {
        pending.forEach((message) => {
          socket.emit("message:queue", message);
        });
        return [];
      });
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId]);

  const emit = <T extends OutboundEvent>(event: T, payload: SocketPayloadMap[T]) => {
    if (event === "message:queue" && !connected) {
      setQueue((pending) => [...pending, payload as FluxMessage]);
      return;
    }
    socketRef.current?.emit(event, payload);
  };

  return {
    connected,
    emit,
    socket: socketRef.current,
    queuedCount: queue.length,
  };
};
