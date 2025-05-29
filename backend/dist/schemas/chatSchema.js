"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMessageSchema = exports.startChatSchema = void 0;
const zod_1 = require("zod");
exports.startChatSchema = zod_1.z.object({
    receiverId: zod_1.z.string().uuid(),
});
exports.sendMessageSchema = zod_1.z.object({
    content: zod_1.z.string().trim().min(1, "Message content is required"),
});
