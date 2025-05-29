"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_controller_1 = require("../controllers/auth.controller");
const router = express_1.default.Router();
router.post("/signup", auth_controller_1.Signup);
router.post("/login", auth_controller_1.Login);
router.post("/logout", auth_controller_1.Logout);
router.post("/refresh-token", auth_controller_1.RefreshToken);
exports.default = router;
