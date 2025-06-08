import { Server, Socket } from "socket.io";
import http from "http";
import express from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { RateLimiterMemory, RateLimiterRes } from "rate-limiter-flexible";
import dotenv from "dotenv";
import logger from "../lib/logger";

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
    logger.error("❌ No token provided in handshake.auth");
    return next(new Error("No token provided"));
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!);
    logger.info(
      `✅ Token decoded successfully: userId=${(decoded as any).userId}`
    );
    (socket as any).user = decoded;
    next();
  } catch (err) {
    logger.error(
      `❌ JWT verification failed: ${err instanceof Error ? err.message : err}`
    );
    next(new Error("Invalid token"));
  }
});

export const setupSocketHandlers = (io: Server) => {
  setTimeout(() => {
    logger.info(
      `🕵️ Current userSocketMap after 5s: ${JSON.stringify([
        ...userSocketMap.entries(),
      ])}`
    );
  }, 5000);

  io.on("connection", (socket: Socket) => {
    const user = (socket as any).user;

    logger.info(`✅ User connected: ${user.userId}`);

    socket.join(user.userId);
    logger.info(`📌 Joined socket room: ${user.userId}`);
    logger.info(
      `👥 Current socket rooms: ${JSON.stringify(Array.from(socket.rooms))}`
    );

    userSocketMap.set(user.userId, socket.id);
    logger.info(
      `🗺️ Updated userSocketMap: ${JSON.stringify([
        ...userSocketMap.entries(),
      ])}`
    );

    socket.on("join_user_room", () => {
      const userId = user.userId;
      socket.join(userId);
      userSocketMap.set(userId, socket.id);
      logger.info(`📌 Joined socket room: ${userId}`);
      logger.info(
        `🗺️ Updated userSocketMap: ${JSON.stringify([
          ...userSocketMap.entries(),
        ])}`
      );
    });

    socket.on("join_room", async (chatRoomId: string) => {
      try {
        const chatRoom = await prisma.chatRoom.findUnique({
          where: { id: chatRoomId },
        });

        if (!chatRoom) {
          logger.warn(`❌ Chat room not found: ${chatRoomId}`);
          return;
        }

        const isParticipant =
          chatRoom.clientId === user.userId ||
          chatRoom.providerId === user.userId;

        if (!isParticipant) {
          logger.warn(
            `🚫 User ${user.userId} not allowed in room ${chatRoomId}`
          );
          return;
        }

        socket.join(chatRoomId);
        logger.info(`📥 User ${user.userId} joined room: ${chatRoomId}`);
      } catch (err) {
        logger.error(
          `❌ Error in join_room (${chatRoomId}): ${
            err instanceof Error ? err.message : err
          }`
        );
      }
    });

    socket.on("leave_room", (chatRoomId: string) => {
      socket.leave(chatRoomId);
      logger.info(`🚪 User ${user.userId} left room ${chatRoomId}`);
    });

    socket.on("disconnect", () => {
      userSocketMap.delete(user.userId);
      logger.info(`❎ User disconnected: ${user.userId}`);
      logger.info(
        `🗺️ Updated userSocketMap after disconnect: ${JSON.stringify([
          ...userSocketMap.entries(),
        ])}`
      );
    });
  });
};

export { io, app, server };

if (process.env.NODE_ENV !== "test") {
  setupSocketHandlers(io);
}
