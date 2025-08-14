import { io } from "socket.io-client";

// Use your API base URL for the socket connection
const SOCKET_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

let socket = null;

export function connectSocket(token) {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      autoConnect: false,
      transports: ["websocket"],
    });
  }
  if (!socket.connected) {
    socket.connect();
  }
  return socket;
}

export function getSocket() {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
