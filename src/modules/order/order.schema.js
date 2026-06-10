import { z } from "zod";

export const createOrderSchema = {
  body: z.object({
    shippingAddress: z.string().trim().min(5, "Shipping address must be at least 5 characters long"),
    phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Invalid phone number format"),
    paymentMethod: z.enum(["cod", "card"]).optional().default("cod"),
  }),
};

export const updateOrderStatusSchema = {
  body: z
    .object({
      status: z.enum(["pending", "confirmed", "shipping", "delivered", "cancelled", "returned", "processing", "shipped"]).optional(),
      paymentStatus: z.enum(["pending", "paid", "failed"]).optional(),
    })
    .refine((data) => data.status !== undefined || data.paymentStatus !== undefined, {
      message: "At least one of status or paymentStatus must be provided",
    }),
};
