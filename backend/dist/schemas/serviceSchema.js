"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateServiceSchema = exports.serviceSchema = void 0;
const zod_1 = require("zod");
exports.serviceSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .trim()
        .nonempty("Title is required")
        .min(5, "Title must be at least 5 characters long"),
    description: zod_1.z
        .string()
        .trim()
        .nonempty("Description is required")
        .min(10, "Description must be at least 10 characters long"),
    price: zod_1.z.coerce.number({ invalid_type_error: "Price must be a number" }),
    categoryId: zod_1.z.string().uuid("Invalid category"),
});
exports.updateServiceSchema = exports.serviceSchema.partial();
