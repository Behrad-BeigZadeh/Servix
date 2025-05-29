import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { useUserStore } from "./userStore";

interface SocketStore {
  socket: Socket | null;
  connect: () => void;
  disconnect: () => void;
}

export const useSocketStore = create<SocketStore>((set, get) => ({
  socket: null,

  connect: () => {
    const { accessToken } = useUserStore.getState();
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

    socket.on("connect_error", (err) => {
      console.log("❌ Socket connection error:", err.message);
    });
    socket.on("connect", () => {
      console.log("🟢 Socket connected with id:", socket.id);

      socket.emit("join_user_room");
    });
    socket.onAny((event, ...args) => {
      console.log("📡 Socket Event:", event, args);
    });

    socket.on("disconnect", () => {
      console.log("🔴 Socket disconnected");
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
