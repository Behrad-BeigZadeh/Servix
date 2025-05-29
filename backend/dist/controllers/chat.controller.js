"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markMessageAsSeen = exports.sendMessage = exports.startOrGetChatRoom = exports.getTotalUnseenMessages = exports.getChatRoomMessages = exports.getAllUsersChats = void 0;
const prisma_1 = require("../lib/prisma");
const chatSchema_1 = require("../schemas/chatSchema");
const socket_1 = require("../sockets/socket");
const socket_2 = require("../sockets/socket");
const getAllUsersChats = async (req, res) => {
    try {
        const user = req.user;
        const allChats = await prisma_1.prisma.chatRoom.findMany({
            where: {
                OR: [{ clientId: user.id }, { providerId: user.id }],
            },
            include: {
                client: {
                    select: { id: true, username: true, avatar: true },
                },
                provider: {
                    select: { id: true, username: true, avatar: true },
                },
                messages: {
                    take: 1,
                    orderBy: { createdAt: "desc" },
                },
            },
            orderBy: {
                updatedAt: "desc",
            },
        });
        // Add unseen message count for each chat
        const chatsWithUnseenCount = await Promise.all(allChats.map(async (chat) => {
            const unseenCount = await prisma_1.prisma.message.count({
                where: {
                    chatRoomId: chat.id,
                    senderId: { not: user.id },
                    NOT: {
                        seenByIds: {
                            has: user.id,
                        },
                    },
                },
            });
            return {
                ...chat,
                unseenCount,
            };
        }));
        return res.status(200).json({ allChats: chatsWithUnseenCount });
    }
    catch (error) {
        console.error("Error in getAllUsersChats controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getAllUsersChats = getAllUsersChats;
const getChatRoomMessages = async (req, res) => {
    try {
        const user = req.user;
        const { chatRoomId } = req.params;
        const chatRoom = await prisma_1.prisma.chatRoom.findUnique({
            where: { id: chatRoomId },
            include: {
                client: {
                    select: { id: true, username: true, avatar: true },
                },
                provider: {
                    select: { id: true, username: true, avatar: true },
                },
            },
        });
        if (!chatRoom) {
            return res.status(404).json({ error: "Chat room not found" });
        }
        const messages = await prisma_1.prisma.message.findMany({
            where: { chatRoomId },
            orderBy: { createdAt: "asc" },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });
        const otherUser = chatRoom.client.id === user.id ? chatRoom.provider : chatRoom.client;
        return res.status(200).json({ messages, otherUser });
    }
    catch (error) {
        console.error("Error in getChatRoomMessages controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getChatRoomMessages = getChatRoomMessages;
const getTotalUnseenMessages = async (req, res) => {
    try {
        const user = req.user;
        const totalUnseen = await prisma_1.prisma.message.count({
            where: {
                senderId: { not: user.id },
                NOT: {
                    seenByIds: {
                        has: user.id,
                    },
                },
                chatRoom: {
                    OR: [{ clientId: user.id }, { providerId: user.id }],
                },
            },
        });
        return res.status(200).json({ totalUnseen });
    }
    catch (error) {
        console.error("Error fetching total unseen messages:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.getTotalUnseenMessages = getTotalUnseenMessages;
const startOrGetChatRoom = async (req, res) => {
    try {
        const user = req.user;
        const parsed = chatSchema_1.startChatSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors });
        }
        const { receiverId } = parsed.data;
        if (receiverId === user.id) {
            return res
                .status(400)
                .json({ error: "You cannot start a chat with yourself" });
        }
        const existingChat = await prisma_1.prisma.chatRoom.findFirst({
            where: {
                OR: [
                    { clientId: user.id, providerId: receiverId },
                    { clientId: receiverId, providerId: user.id },
                ],
            },
        });
        if (existingChat) {
            return res.status(200).json({ chatRoom: existingChat, isNew: false });
        }
        let clientId;
        let providerId;
        if (user.role === "CLIENT") {
            clientId = user.id;
            providerId = receiverId;
        }
        else if (user.role === "PROVIDER") {
            clientId = receiverId;
            providerId = user.id;
        }
        else {
            return res.status(400).json({ error: "This role cannot start a chat" });
        }
        const newChat = await prisma_1.prisma.chatRoom.create({
            data: {
                clientId,
                providerId,
            },
        });
        return res.status(201).json({ chatRoom: newChat, isNew: true });
    }
    catch (error) {
        console.error("Failed to start chat room:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.startOrGetChatRoom = startOrGetChatRoom;
const sendMessage = async (req, res) => {
    try {
        const user = req.user;
        const { chatRoomId } = req.params;
        const parsed = chatSchema_1.sendMessageSchema.safeParse(req.body);
        if (!parsed.success) {
            return res.status(400).json({ error: parsed.error.errors });
        }
        const { content } = parsed.data;
        const chatRoom = await prisma_1.prisma.chatRoom.findUnique({
            where: { id: chatRoomId },
        });
        if (!chatRoom) {
            return res.status(404).json({ error: "Chat room not found" });
        }
        const isParticipant = chatRoom.clientId === user.id || chatRoom.providerId === user.id;
        if (!isParticipant) {
            return res
                .status(403)
                .json({ error: "You are not part of this chat room" });
        }
        const contentString = typeof content === "string" ? content.trim() : JSON.stringify(content);
        const message = await prisma_1.prisma.message.create({
            data: {
                chatRoomId,
                senderId: user.id,
                content: contentString,
                seenByIds: [user.id],
            },
            include: {
                sender: {
                    select: {
                        id: true,
                        username: true,
                        avatar: true,
                    },
                },
            },
        });
        // 1. Emit message to chat room
        socket_2.io.to(chatRoomId).emit("new_message", message);
        // 2. Determine recipient
        const recipientId = user.id === chatRoom.clientId ? chatRoom.providerId : chatRoom.clientId;
        // 3. Get recipient's socket ID
        const recipientSocketId = (0, socket_1.getUserSocketId)(recipientId);
        // 4. Only send notification if recipient is NOT in the chat room
        const isRecipientInRoom = recipientSocketId &&
            socket_2.io.sockets.adapter.rooms.get(chatRoomId)?.has(recipientSocketId);
        if (!isRecipientInRoom && recipientSocketId) {
            socket_2.io.to(recipientSocketId).emit("new_notification", {
                type: "NEW_MESSAGE",
                chatRoomId,
                message,
            });
        }
        return res.status(201).json({ message });
    }
    catch (error) {
        console.error("Error in sendMessage controller:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.sendMessage = sendMessage;
const markMessageAsSeen = async (req, res) => {
    try {
        const { messageId } = req.params;
        const user = req.user;
        const message = await prisma_1.prisma.message.findUnique({
            where: { id: messageId },
            include: {
                chatRoom: true,
            },
        });
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        const isParticipant = message.chatRoom.clientId === user.id ||
            message.chatRoom.providerId === user.id;
        if (!isParticipant) {
            return res.status(403).json({ error: "Not authorized" });
        }
        if (message.senderId === user.id) {
            return res
                .status(400)
                .json({ error: "You cannot mark your own message as seen" });
        }
        let updatedMessage = message;
        if (!message.seenByIds.includes(user.id)) {
            updatedMessage = await prisma_1.prisma.message.update({
                where: { id: messageId },
                data: {
                    read: true,
                    seenByIds: {
                        set: [...message.seenByIds, user.id],
                    },
                },
                include: {
                    chatRoom: true,
                },
            });
        }
        const senderSocketId = (0, socket_1.getUserSocketId)(message.senderId);
        if (senderSocketId) {
            socket_2.io.to(senderSocketId).emit("message_seen", {
                messageId: message.id,
                chatRoomId: message.chatRoomId,
            });
        }
        return res.status(200).json({ message: updatedMessage });
    }
    catch (error) {
        console.error("Error in markMessageAsSeen:", error);
        return res.status(500).json({ error: "Internal server error" });
    }
};
exports.markMessageAsSeen = markMessageAsSeen;
