import { io, type Socket } from "socket.io-client";
import { API_BASE } from "./http";

let socket: Socket | null = null;

// Backend WebSocket bağlantısı (tek örnek)
export function getSocket(): Socket {
  if (!socket) {
    socket = io(API_BASE, {
      transports: ["websocket", "polling"],
      reconnectionAttempts: 3,
      timeout: 4000,
    });
  }
  return socket;
}
