"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.compareHashedToken = exports.hashToken = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const hashToken = async (token) => {
    return await bcrypt_1.default.hash(token, 10);
};
exports.hashToken = hashToken;
const compareHashedToken = async (token, hashedToken) => {
    return await bcrypt_1.default.compare(token, hashedToken);
};
exports.compareHashedToken = compareHashedToken;
