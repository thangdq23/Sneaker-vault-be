import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "./product.controller.js";
import { authenticateToken, authorizeRole } from "../auth/auth.middleware.js";

const routerProduct = express.Router();

routerProduct.get("/", getProducts);
routerProduct.get("/:id", getProductById);
routerProduct.post(
  "/",
  authenticateToken,
  authorizeRole("admin"),
  createProduct
);
routerProduct.put(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  updateProduct
);
routerProduct.delete(
  "/:id",
  authenticateToken,
  authorizeRole("admin"),
  deleteProduct
);

export default routerProduct;
