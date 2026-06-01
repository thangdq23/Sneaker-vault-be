import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  updateProductSizeStock,
  deleteProduct,
} from "./product.controller.js";
import { authenticateToken, authorizeRole } from "../../shared/middlewares/auth.middleware.js";
import { validateRequest } from "../../shared/middlewares/validate.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
  updateProductSizeStockSchema,
  getProductsQuerySchema,
} from "./product.schema.js";

const routerProduct = express.Router();

routerProduct.get("/", validateRequest(getProductsQuerySchema), getProducts);
routerProduct.get("/:id", getProductById);
routerProduct.post(
  "/",
  authenticateToken,
  authorizeRole("admin"),
  validateRequest(createProductSchema),
  createProduct,
);
routerProduct.put(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  validateRequest(updateProductSchema),
  updateProduct,
);
routerProduct.patch(
  "/:id/sizes",
  authenticateToken,
  authorizeRole("admin"),
  validateRequest(updateProductSizeStockSchema),
  updateProductSizeStock,
);
routerProduct.delete(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  deleteProduct,
);

export default routerProduct;
