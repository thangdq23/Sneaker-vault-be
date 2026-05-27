import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./product.controller.js";
import { authenticateToken, authorizeRole } from "../../shared/middlewares/auth.middleware.js";
import { validateRequest } from "../../shared/middlewares/validate.middleware.js";
import {
  createProductSchema,
  updateProductSchema,
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
routerProduct.delete(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  deleteProduct,
);

export default routerProduct;
