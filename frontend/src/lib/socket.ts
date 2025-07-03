import { useAuthTokenStore } from "@/stores/tokenStore";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const connectSocket = () => {
  const { accessToken } = useAuthTokenStore.getState();

  if (!accessToken || socket) return;

  socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
    auth: { token: accessToken },
  });

  socket.on("connect", () => {
    console.log("🟢 Connected to Socket.IO");
  });

  socket.on("disconnect", () => {
    console.log("🔴 Disconnected from Socket.IO");
  });
};

export const getSocket = () => socket;
