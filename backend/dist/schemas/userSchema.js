"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateUserSchema = void 0;
const zod_1 = require("zod");
exports.updateUserSchema = zod_1.z.object({
    username: zod_1.z
        .string()
        .min(3, "Username must be at least 3 characters")
        .optional(),
    email: zod_1.z.string().email("Invalid email address").optional(),
    password: zod_1.z
        .string()
        .optional()
        .refine((val) => !val || val.length >= 6, {
        message: "Password must be at least 6 characters",
    }),
    avatar: zod_1.z.string().url("Avatar must be a valid URL").optional(),
});
