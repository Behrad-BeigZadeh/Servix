"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const midddleware_1 = require("../middleware/midddleware");
const users_controller_1 = require("../controllers/users.controller");
const router = express_1.default.Router();
router.get("/auth-user", midddleware_1.verifyToken, users_controller_1.authUser);
router.put("/auth-user", midddleware_1.verifyToken, users_controller_1.updateProfile);
exports.default = router;
