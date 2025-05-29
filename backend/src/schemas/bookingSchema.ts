import { z } from "zod";

export const bookingSchema = z.object({
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  serviceId: z.string().nonempty("Service ID is required"),
});

export const updateBookingStatusSchema = z.object({
  status: z.enum(["PENDING", "ACCEPTED", "DECLINED", "COMPLETED", "CANCELLED"]),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type UpdateBookingStatusInput = z.infer<
  typeof updateBookingStatusSchema
>;
