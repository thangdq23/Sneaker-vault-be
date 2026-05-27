import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;

export const addToCartSchema = {
  body: z.object({
    productId: z.string().regex(objectIdRegex, "Invalid productId format"),
    size: z.number().int().positive("size must be a positive integer"),
    quantity: z.number().int().min(1, "quantity must be at least 1").optional().default(1),
  }),
};

export const updateCartItemSchema = {
  body: z.object({
    quantity: z.number().int().min(1, "quantity must be at least 1"),
  }),
};
