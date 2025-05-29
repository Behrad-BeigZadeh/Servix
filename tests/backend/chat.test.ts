import * as dotenv from "dotenv";
dotenv.config({ path: ".env.test" });
import request from "supertest";
import app from "../../backend/src/app";
import { PrismaClient } from "../../backend/src/generated/prisma";

const prisma = new PrismaClient();

jest.setTimeout(20000);

describe("Chat Routes", () => {
  let clientToken: string;
  let providerToken: string;
  let clientId: string;
  let providerId: string;
  let chatRoomId: string;

  const uniqueSuffix = Date.now();
  const clientEmail = `client-${uniqueSuffix}@test.com`;
  const providerEmail = `provider-${uniqueSuffix}@test.com`;

  beforeAll(async () => {
    await prisma.message.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.user.deleteMany();

    // Register client
    await request(app).post("/api/auth/signup").send({
      username: "client1",
      email: clientEmail,
      password: "clientpass",
      role: "CLIENT",
    });

    const clientLogin = await request(app).post("/api/auth/login").send({
      email: clientEmail,
      password: "clientpass",
    });
    if (!clientLogin.body || !clientLogin.body.data) {
      throw new Error(
        `Client login failed: ${JSON.stringify(clientLogin.body)}`
      );
    }

    clientToken = clientLogin.body.data.accessToken;
    clientId = clientLogin.body.data.user.id;

    clientToken = clientLogin.body.data.accessToken;
    clientId = clientLogin.body.data.user.id;

    // Register provider
    await request(app).post("/api/auth/signup").send({
      username: "provider1",
      email: providerEmail,
      password: "providerpass",
      role: "PROVIDER",
    });

    const providerLogin = await request(app).post("/api/auth/login").send({
      email: providerEmail,
      password: "providerpass",
    });

    providerToken = providerLogin.body.data.accessToken;
    providerId = providerLogin.body.data.user.id;

    // Create chat room
    const chatRoom = await prisma.chatRoom.create({
      data: {
        clientId,
        providerId,
      },
    });

    chatRoomId = chatRoom.id;

    // Seed messages
    await prisma.message.createMany({
      data: [
        {
          chatRoomId,
          senderId: providerId,
          content: "Hello client",
          seenByIds: [],
        },
        {
          chatRoomId,
          senderId: clientId,
          content: "Hi, I need your service",
          seenByIds: [providerId],
        },
      ],
    });
  });

  afterAll(async () => {
    await prisma.message.deleteMany();
    await prisma.chatRoom.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  describe("GET /api/chat", () => {
    it("should return all chats for the authenticated client", async () => {
      const res = await request(app)
        .get("/api/chat")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.allChats)).toBe(true);
      expect(res.body.allChats.length).toBe(1);

      const chat = res.body.allChats[0];
      expect(chat.client.id).toBe(clientId);
      expect(chat.provider.id).toBe(providerId);
      expect(chat.messages.length).toBe(1);
      expect(chat.unseenCount).toBe(1);
    });

    it("should return unseenCount = 0 when messages are marked seen", async () => {
      await prisma.message.updateMany({
        where: {
          chatRoomId,
          senderId: providerId,
        },
        data: {
          seenByIds: {
            push: clientId,
          },
        },
      });

      const res = await request(app)
        .get("/api/chat")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.allChats[0].unseenCount).toBe(0);
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/api/chat");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("GET /api/chat/:chatRoomId/messages", () => {
    it("should return all messages and the other user", async () => {
      const res = await request(app)
        .get(`/api/chat/${chatRoomId}/messages`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.messages)).toBe(true);
      expect(res.body.messages.length).toBe(2);

      const contents = res.body.messages.map((m: any) => m.content);
      expect(contents).toContain("Hello client");
      expect(contents).toContain("Hi, I need your service");

      expect(res.body.otherUser.id).toBe(providerId);
    });

    it("should return 404 for invalid chat room", async () => {
      const res = await request(app)
        .get("/api/chat/invalid-room-id/messages")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Chat room not found");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get(`/api/chat/${chatRoomId}/messages`);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("GET /api/chat/unseen-total", () => {
    beforeEach(async () => {
      await prisma.message.updateMany({
        where: { chatRoomId, senderId: providerId },
        data: { seenByIds: [providerId] },
      });
    });

    it("should return total unseen messages for client", async () => {
      const res = await request(app)
        .get("/api/chat/unseen-total")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUnseen).toBe(1);
    });

    it("should return 0 unseen messages after marking as seen", async () => {
      await prisma.message.updateMany({
        where: { chatRoomId, senderId: providerId },
        data: { seenByIds: [providerId, clientId] },
      });

      const res = await request(app)
        .get("/api/chat/unseen-total")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.totalUnseen).toBe(0);
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).get("/api/chat/unseen-total");

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("POST /api/chat/:chatRoomId/messages", () => {
    it("should send a message", async () => {
      const res = await request(app)
        .post(`/api/chat/${chatRoomId}/messages`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ content: "This is a new message" });

      expect(res.status).toBe(201);
      expect(res.body.message.content).toBe("This is a new message");
      expect(res.body.message.senderId).toBe(clientId);
    });

    it("should return 404 for invalid chat room", async () => {
      const res = await request(app)
        .post("/api/chat/invalid-room/messages")
        .set("Authorization", `Bearer ${clientToken}`)
        .send({ content: "test" });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Chat room not found");
    });

    it("should return 403 if user not in chat", async () => {
      const outsiderEmail = `outsider-${Date.now()}@test.com`;

      await request(app).post("/api/auth/signup").send({
        username: "outsider",
        email: outsiderEmail,
        password: "password",
        role: "CLIENT",
      });

      const outsiderLogin = await request(app).post("/api/auth/login").send({
        email: outsiderEmail,
        password: "password",
      });

      const outsiderToken = outsiderLogin.body.data.accessToken;

      const res = await request(app)
        .post(`/api/chat/${chatRoomId}/messages`)
        .set("Authorization", `Bearer ${outsiderToken}`)
        .send({ content: "I'm not allowed" });

      expect(res.status).toBe(403);
      expect(res.body.error).toBe("You are not part of this chat room");
    });

    it("should return 400 if content missing", async () => {
      const res = await request(app)
        .post(`/api/chat/${chatRoomId}/messages`)
        .set("Authorization", `Bearer ${clientToken}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app)
        .post(`/api/chat/${chatRoomId}/messages`)
        .send({ content: "Hello" });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
  });

  describe("PATCH /api/chat/:messageId/seen", () => {
    let providerMessageId: string;

    beforeEach(async () => {
      const msg = await prisma.message.findFirst({
        where: {
          chatRoomId,
          senderId: providerId,
        },
      });
      if (!msg) throw new Error("Provider message not found");
      providerMessageId = msg.id;

      await prisma.message.update({
        where: { id: providerMessageId },
        data: { seenByIds: [] },
      });
    });
    it("should return 403 if user is not a participant in the chat", async () => {
      await request(app).post("/api/auth/signup").send({
        username: "someone",
        email: "someone@gmail.com",
        password: "password",
        role: "CLIENT",
      });

      const outsiderLogin = await request(app).post("/api/auth/login").send({
        email: "someone@gmail.com",
        password: "password",
      });

      const outsiderToken = outsiderLogin.body.data.accessToken;
      const res = await request(app)
        .patch(`/api/chat/${providerMessageId}/seen`)
        .set("Authorization", `Bearer ${outsiderToken}`);

      expect(res.status).toBe(403);
      expect(res.body).toHaveProperty("error", "Not authorized");
    });

    it("should return 400 if user tries to mark their own message as seen", async () => {
      const res = await request(app)
        .patch(`/api/chat/${providerMessageId}/seen`)
        .set("Authorization", `Bearer ${providerToken}`);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty(
        "error",
        "You cannot mark your own message as seen"
      );
    });

    it("should not duplicate user ID if already seen", async () => {
      // First mark as seen
      await prisma.message.update({
        where: { id: providerMessageId },
        data: { seenByIds: [clientId] },
      });

      const res = await request(app)
        .patch(`/api/chat/${providerMessageId}/seen`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(
        res.body.message.seenByIds.filter((id: string) => id === clientId)
      ).toHaveLength(1);
    });
    it("should mark message as seen", async () => {
      const res = await request(app)
        .patch(`/api/chat/${providerMessageId}/seen`)
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message.seenByIds).toContain(clientId);
    });

    it("should return 404 if message does not exist", async () => {
      const res = await request(app)
        .patch("/api/chat/nonexistent-message/seen")
        .set("Authorization", `Bearer ${clientToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty("error", "Message not found");
    });

    it("should return 401 if not authenticated", async () => {
      const res = await request(app).patch(
        `/api/chat/${providerMessageId}/seen`
      );

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty("error", "Unauthorized");
    });
  });
});
