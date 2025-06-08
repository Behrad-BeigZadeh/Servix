"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.server = exports.app = exports.io = exports.setupSocketHandlers = exports.getUserSocketId = exports.userSocketMap = void 0;
const socket_io_1 = require("socket.io");
const http_1 = __importDefault(require("http"));
const express_1 = __importDefault(require("express"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = __importDefault(require("../lib/logger"));
dotenv_1.default.config();
const messageRateLimiter = new rate_limiter_flexible_1.RateLimiterMemory({
    points: 10, // 10 messages
    duration: 10, // per 10 seconds
});
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
exports.userSocketMap = new Map();
const getUserSocketId = (userId) => {
    return exports.userSocketMap.get(userId);
};
exports.getUserSocketId = getUserSocketId;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: process.env.CLIENT_URL,
        methods: ["GET", "POST", "PATCH"],
    },
});
exports.io = io;
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        logger_1.default.error("❌ No token provided in handshake.auth");
        return next(new Error("No token provided"));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.ACCESS_TOKEN_SECRET);
        logger_1.default.info(`✅ Token decoded successfully: userId=${decoded.userId}`);
        socket.user = decoded;
        next();
    }
    catch (err) {
        logger_1.default.error(`❌ JWT verification failed: ${err instanceof Error ? err.message : err}`);
        next(new Error("Invalid token"));
    }
});
const setupSocketHandlers = (io) => {
    setTimeout(() => {
        logger_1.default.info(`🕵️ Current userSocketMap after 5s: ${JSON.stringify([
            ...exports.userSocketMap.entries(),
        ])}`);
    }, 5000);
    io.on("connection", (socket) => {
        const user = socket.user;
        logger_1.default.info(`✅ User connected: ${user.userId}`);
        socket.join(user.userId);
        logger_1.default.info(`📌 Joined socket room: ${user.userId}`);
        logger_1.default.info(`👥 Current socket rooms: ${JSON.stringify(Array.from(socket.rooms))}`);
        exports.userSocketMap.set(user.userId, socket.id);
        logger_1.default.info(`🗺️ Updated userSocketMap: ${JSON.stringify([
            ...exports.userSocketMap.entries(),
        ])}`);
        socket.on("join_user_room", () => {
            const userId = user.userId;
            socket.join(userId);
            exports.userSocketMap.set(userId, socket.id);
            logger_1.default.info(`📌 Joined socket room: ${userId}`);
            logger_1.default.info(`🗺️ Updated userSocketMap: ${JSON.stringify([
                ...exports.userSocketMap.entries(),
            ])}`);
        });
        socket.on("join_room", async (chatRoomId) => {
            try {
                const chatRoom = await prisma_1.prisma.chatRoom.findUnique({
                    where: { id: chatRoomId },
                });
                if (!chatRoom) {
                    logger_1.default.warn(`❌ Chat room not found: ${chatRoomId}`);
                    return;
                }
                const isParticipant = chatRoom.clientId === user.userId ||
                    chatRoom.providerId === user.userId;
                if (!isParticipant) {
                    logger_1.default.warn(`🚫 User ${user.userId} not allowed in room ${chatRoomId}`);
                    return;
                }
                socket.join(chatRoomId);
                logger_1.default.info(`📥 User ${user.userId} joined room: ${chatRoomId}`);
            }
            catch (err) {
                logger_1.default.error(`❌ Error in join_room (${chatRoomId}): ${err instanceof Error ? err.message : err}`);
            }
        });
        socket.on("leave_room", (chatRoomId) => {
            socket.leave(chatRoomId);
            logger_1.default.info(`🚪 User ${user.userId} left room ${chatRoomId}`);
        });
        socket.on("disconnect", () => {
            exports.userSocketMap.delete(user.userId);
            logger_1.default.info(`❎ User disconnected: ${user.userId}`);
            logger_1.default.info(`🗺️ Updated userSocketMap after disconnect: ${JSON.stringify([
                ...exports.userSocketMap.entries(),
            ])}`);
        });
    });
};
exports.setupSocketHandlers = setupSocketHandlers;
if (process.env.NODE_ENV !== "test") {
    (0, exports.setupSocketHandlers)(io);
}
