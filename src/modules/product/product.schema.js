import { z } from "zod";

const productShape = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  brand: z.string().trim().optional(),
  category: z.string().trim().optional(),
  price: z.number().min(0, "Price must be at least 0"),
  description: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  sizes: z.array(z.number()).optional(),
  stock: z.number().min(0, "Stock must be at least 0").optional(),
  isNewProduct: z.boolean().optional(),
  isSale: z.boolean().optional(),
  salePrice: z.number().min(0).nullable().optional(),
  discountPercent: z.number().min(0).max(100).nullable().optional(),
});

export const createProductSchema = {
  body: productShape
    .refine(
      (data) => {
        if (data.isSale) {
          return data.salePrice !== undefined && data.salePrice !== null && data.salePrice >= 0;
        }
        return true;
      },
      {
        message: "salePrice is required and must be >= 0 when isSale is true",
        path: ["salePrice"],
      },
    )
    .refine(
      (data) => {
        if (data.isSale) {
          return (
            data.discountPercent !== undefined &&
            data.discountPercent !== null &&
            data.discountPercent >= 0 &&
            data.discountPercent <= 100
          );
        }
        return true;
      },
      {
        message: "discountPercent is required and must be between 0 and 100 when isSale is true",
        path: ["discountPercent"],
      },
    ),
};

export const updateProductSchema = {
  body: productShape
    .partial()
    .refine(
      (data) => {
        if (data.isSale === true) {
          return data.salePrice !== undefined && data.salePrice !== null && data.salePrice >= 0;
        }
        return true;
      },
      {
        message: "salePrice is required and must be >= 0 when isSale is true",
        path: ["salePrice"],
      },
    )
    .refine(
      (data) => {
        if (data.isSale === true) {
          return (
            data.discountPercent !== undefined &&
            data.discountPercent !== null &&
            data.discountPercent >= 0 &&
            data.discountPercent <= 100
          );
        }
        return true;
      },
      {
        message: "discountPercent is required and must be between 0 and 100 when isSale is true",
        path: ["discountPercent"],
      },
    ),
};

export const getProductsQuerySchema = {
  query: z.object({
    search: z.string().optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).optional(),
    sort: z.string().optional(),
  }),
};
