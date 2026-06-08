import { z } from "zod";

const productShape = z.object({
  name: z.string().trim().min(1, "Product name is required"),
  sku: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  price: z.number().min(0, "Price must be at least 0 VNĐ"),
  description: z.string().trim().optional(),
  images: z.array(z.string()).optional(),
  sizes: z
    .array(
      z.object({
        size: z.number("Size must be a number"),
        stock: z.number().min(0, "Stock for size must be at least 0"),
      })
    )
    .optional(),
  stock: z.number().min(0, "Stock must be at least 0").optional(),
  isNewProduct: z.boolean().optional(),
  isSale: z.boolean().optional(),
  salePrice: z.number().min(0, "salePrice must be at least 0 VNĐ").nullable().optional(),
});

export const createProductSchema = {
  body: productShape.refine(
    (data) => {
      if (data.isSale) {
        return (
          data.salePrice !== undefined &&
          data.salePrice !== null &&
          data.salePrice >= 0
        );
      }
      return true;
    },
    {
      message: "salePrice is required and must be >= 0 VNĐ when isSale is true",
      path: ["salePrice"],
    },
  ),
};

export const updateProductSchema = {
  body: productShape.partial().refine(
    (data) => {
      if (data.isSale === true) {
        return (
          data.salePrice !== undefined &&
          data.salePrice !== null &&
          data.salePrice >= 0
        );
      }
      return true;
    },
    {
      message: "salePrice is required and must be >= 0 VNĐ when isSale is true",
      path: ["salePrice"],
    },
  ),
};

export const getProductsQuerySchema = {
  query: z.object({
    search: z.string().optional(),
    brand: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    page: z.coerce.number().int().min(1).optional(),
    limit: z.coerce.number().int().min(1).optional(),
    sort: z.string().optional(),
    order: z.string().optional(),
    stockMin: z.coerce.number().min(0).optional(),
    stockMax: z.coerce.number().min(0).optional(),
  }),
};

export const updateProductSizeStockSchema = {
  body: z.object({
    size: z.number("Size must be a number"),
    stock: z.number().min(0, "Stock must be at least 0"),
  }),
};
