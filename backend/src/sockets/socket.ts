import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import dotenv from "dotenv";
dotenv.config();

const messageRateLimiter = new RateLimiterMemory({
  points: 10, // 10 messages
  duration: 10, // per 10 seconds
});

const app = express();
const server = http.createServer(app);

export const userSocketMap = new Map<string, string>();

export const getUserSocketId = (userId: string) => {
  return userSocketMap.get(userId);
};

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PATCH"],
  },
});

io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;

  if (!token) {
    console.error("❌ No token provided in handshake.auth");
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    console.log("✅ Token decoded successfully:", decoded);
    (socket as any).user = decoded;
    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err);
    next(new Error("Invalid token"));
  }
});

export const setupSocketHandlers = (io: Server) => {
  setTimeout(() => {
    console.log("🕵️ Current userSocketMap after 5s:", [
      ...userSocketMap.entries(),
    ]);
  }, 5000);

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;

    console.log("✅ User connected:", user.userId);

    socket.join(user.userId);
    console.log("📌 Joined socket room:", user.userId);
    console.log("👥 Current socket rooms:", Array.from(socket.rooms));

    userSocketMap.set(user.userId, socket.id);
    console.log("🗺️ Updated userSocketMap:", [...userSocketMap.entries()]);

    socket.on("join_user_room", () => {
      const userId = user.userId;
      socket.join(userId);
      userSocketMap.set(userId, socket.id);
      console.log(`📌 Joined socket room: ${userId}`);
      console.log("🗺️ Updated userSocketMap:", [...userSocketMap.entries()]);
    });

    socket.on("join_room", async (chatRoomId: string) => {
      try {
        const chatRoom = await prisma.chatRoom.findUnique({
          where: { id: chatRoomId },
        });

        if (!chatRoom) {
          return console.warn("❌ Chat room not found:", chatRoomId);
        }

        const isParticipant =
          chatRoom.clientId === user.userId ||
          chatRoom.providerId === user.userId;

        if (!isParticipant) {
          return console.warn(
            `🚫 User ${user.userId} not allowed in room ${chatRoomId}`
          );
        }

        socket.join(chatRoomId);
        console.log(`📥 User ${user.userId} joined room: ${chatRoomId}`);
      } catch (err) {
        console.error("Error in join_room:", err);
      }
    });
    socket.on("leave_room", (chatRoomId: string) => {
      socket.leave(chatRoomId);
      console.log(`🚪 User ${user.userId} left room ${chatRoomId}`);
    });

    socket.on("disconnect", () => {
      userSocketMap.delete(user.userId);
      console.log("❎ User disconnected:", user.userId);
      console.log("🗺️ Updated userSocketMap after disconnect:", [
        ...userSocketMap.entries(),
      ]);
    });
  });
};

export { io, app, server };

if (process.env.NODE_ENV !== "test") {
  setupSocketHandlers(io);
}
