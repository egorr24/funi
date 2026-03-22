"use client";

import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { FluxMessage, SocketPayloadMap } from "@/src/types/flux";

type OutboundEvent = keyof SocketPayloadMap;

export const useSocket = (userId: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!userId || userId === "u_me") return;

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
      console.log("> Connected to Socket.io server");
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
