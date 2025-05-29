import express from "express";
import { verifyToken } from "../middleware/midddleware";
import {
  startOrGetChatRoom,
  getAllUsersChats,
  getChatRoomMessages,
  sendMessage,
  markMessageAsSeen,
  getTotalUnseenMessages,
} from "../controllers/chat.controller";

const router = express.Router();

router.get("/", verifyToken, getAllUsersChats);
router.post("/", verifyToken, startOrGetChatRoom);
router.get("/unseen-total", verifyToken, getTotalUnseenMessages);
router.get("/:chatRoomId/messages", verifyToken, getChatRoomMessages);
router.post("/:chatRoomId/messages", verifyToken, sendMessage);
router.patch("/:messageId/seen", verifyToken, markMessageAsSeen);

export default router;
