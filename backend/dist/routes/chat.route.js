"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const midddleware_1 = require("../middleware/midddleware");
const chat_controller_1 = require("../controllers/chat.controller");
const router = express_1.default.Router();
router.get("/", midddleware_1.verifyToken, chat_controller_1.getAllUsersChats);
router.post("/", midddleware_1.verifyToken, chat_controller_1.startOrGetChatRoom);
router.get("/unseen-total", midddleware_1.verifyToken, chat_controller_1.getTotalUnseenMessages);
router.get("/:chatRoomId/messages", midddleware_1.verifyToken, chat_controller_1.getChatRoomMessages);
router.post("/:chatRoomId/messages", midddleware_1.verifyToken, chat_controller_1.sendMessage);
router.patch("/:messageId/seen", midddleware_1.verifyToken, chat_controller_1.markMessageAsSeen);
exports.default = router;
