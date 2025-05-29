import { z } from "zod";

export const startChatSchema = z.object({
  receiverId: z.string().uuid(),
});

export const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Message content is required"),
});
