import { z } from "zod";
export const serviceSchema = z.object({
  title: z
    .string()
    .trim()
    .nonempty("Title is required")
    .min(5, "Title must be at least 5 characters long"),
  description: z
    .string()
    .trim()
    .nonempty("Description is required")
    .min(10, "Description must be at least 10 characters long"),
  price: z.coerce.number({ invalid_type_error: "Price must be a number" }),
  categoryId: z.string().uuid("Invalid category"),
});

export const updateServiceSchema = serviceSchema.partial();

export type ServiceInput = z.infer<typeof serviceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
