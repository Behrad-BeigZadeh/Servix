"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, "Username must be at least 3 characters"),
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .nonempty("Email is required"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
    role: zod_1.z.enum(["CLIENT", "PROVIDER"]),
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string()
        .email("Invalid email address")
        .nonempty("Email is required"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
