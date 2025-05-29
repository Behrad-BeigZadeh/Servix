"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookingStatusSchema = exports.bookingSchema = void 0;
const zod_1 = require("zod");
exports.bookingSchema = zod_1.z.object({
    date: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    serviceId: zod_1.z.string().nonempty("Service ID is required"),
});
exports.updateBookingStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["PENDING", "ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"]),
});
