import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useAuthTokenStore } from "./tokenStore";

interface SocketStore {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,

  connect: () => {
    const { accessToken } = useAuthTokenStore.getState();
    const existingSocket = get().socket;

    if (!accessToken) {
      console.warn("⚠️ No access token available, cannot connect socket");
      return;
    }

    if (existingSocket && existingSocket.connected) {
      return;
    }

    const token = accessToken.startsWith("Bearer ")
      ? accessToken.split(" ")[1]
      : accessToken;

    const socket = io(process.env.NEXT_PUBLIC_BACKEND_URL!, {
      auth: { token },
      transports: ["websocket"], // force websocket only to avoid polling issues
    });

    set({ socket });
  },

  disconnect: () => {
    const socket = get().socket;
    if (socket) {
      socket.removeAllListeners();
      socket.disconnect();
      set({ socket: null });
    }
  },
}));
