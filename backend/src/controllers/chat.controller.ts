import { Response } from "express";
import { prisma } from "../lib/prisma";
import { AuthenticatedRequest } from "../middleware/midddleware";
import { sendMessageSchema, startChatSchema } from "../schemas/chatSchema";
import { getUserSocketId } from "../sockets/socket";
import { io } from "../sockets/socket";

export const getAllUsersChats = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;

    const allChats = await prisma.chatRoom.findMany({
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
    const chatsWithUnseenCount = await Promise.all(
      allChats.map(async (chat) => {
        const unseenCount = await prisma.message.count({
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
      })
    );

    return res.status(200).json({ allChats: chatsWithUnseenCount });
  } catch (error) {
    console.error("Error in getAllUsersChats controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getChatRoomMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;
    const { chatRoomId } = req.params;

    const chatRoom = await prisma.chatRoom.findUnique({
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

    const messages = await prisma.message.findMany({
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

    const otherUser =
      chatRoom.client.id === user.id ? chatRoom.provider : chatRoom.client;

    return res.status(200).json({ messages, otherUser });
  } catch (error) {
    console.error("Error in getChatRoomMessages controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getTotalUnseenMessages = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;

    const totalUnseen = await prisma.message.count({
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
  } catch (error) {
    console.error("Error fetching total unseen messages:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const startOrGetChatRoom = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;

    const parsed = startChatSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { receiverId } = parsed.data;

    if (receiverId === user.id) {
      return res
        .status(400)
        .json({ error: "You cannot start a chat with yourself" });
    }

    const existingChat = await prisma.chatRoom.findFirst({
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

    let clientId: string;
    let providerId: string;

    if (user.role === "CLIENT") {
      clientId = user.id;
      providerId = receiverId;
    } else if (user.role === "PROVIDER") {
      clientId = receiverId;
      providerId = user.id;
    } else {
      return res.status(400).json({ error: "This role cannot start a chat" });
    }

    const newChat = await prisma.chatRoom.create({
      data: {
        clientId,
        providerId,
      },
    });

    return res.status(201).json({ chatRoom: newChat, isNew: true });
  } catch (error) {
    console.error("Failed to start chat room:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const sendMessage = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const user = req.user;
    const { chatRoomId } = req.params;

    const parsed = sendMessageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.errors });
    }

    const { content } = parsed.data;

    const chatRoom = await prisma.chatRoom.findUnique({
      where: { id: chatRoomId },
    });

    if (!chatRoom) {
      return res.status(404).json({ error: "Chat room not found" });
    }

    const isParticipant =
      chatRoom.clientId === user.id || chatRoom.providerId === user.id;

    if (!isParticipant) {
      return res
        .status(403)
        .json({ error: "You are not part of this chat room" });
    }

    const contentString =
      typeof content === "string" ? content.trim() : JSON.stringify(content);

    const message = await prisma.message.create({
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
    io.to(chatRoomId).emit("new_message", message);

    // 2. Determine recipient
    const recipientId =
      user.id === chatRoom.clientId ? chatRoom.providerId : chatRoom.clientId;

    // 3. Get recipient's socket ID
    const recipientSocketId = getUserSocketId(recipientId);

    // 4. Only send notification if recipient is NOT in the chat room
    const isRecipientInRoom =
      recipientSocketId &&
      io.sockets.adapter.rooms.get(chatRoomId)?.has(recipientSocketId);

    if (!isRecipientInRoom && recipientSocketId) {
      io.to(recipientSocketId).emit("new_notification", {
        type: "NEW_MESSAGE",
        chatRoomId,
        message,
      });
    }

    return res.status(201).json({ message });
  } catch (error) {
    console.error("Error in sendMessage controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const markMessageAsSeen = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<any> => {
  try {
    const { messageId } = req.params;
    const user = req.user;

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        chatRoom: true,
      },
    });

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    const isParticipant =
      message.chatRoom.clientId === user.id ||
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
      updatedMessage = await prisma.message.update({
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

    const senderSocketId = getUserSocketId(message.senderId);
    if (senderSocketId) {
      io.to(senderSocketId).emit("message_seen", {
        messageId: message.id,
        chatRoomId: message.chatRoomId,
      });
    }

    return res.status(200).json({ message: updatedMessage });
  } catch (error) {
    console.error("Error in markMessageAsSeen:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
