import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "./cart.controller.js";
import { authenticateToken } from "../../shared/middlewares/auth.middleware.js";
import { validateRequest } from "../../shared/middlewares/validate.middleware.js";
import { addToCartSchema, updateCartItemSchema } from "./cart.schema.js";

const routerCart = express.Router();

routerCart.post(
  "/add",
  authenticateToken,
  validateRequest(addToCartSchema),
  addToCart,
);
routerCart.get("/", authenticateToken, getCart);
routerCart.put(
  "/item/:itemId",
  authenticateToken,
  validateRequest(updateCartItemSchema),
  updateCartItem,
);
routerCart.delete("/item/:itemId", authenticateToken, removeCartItem);
routerCart.delete("/clear", authenticateToken, clearCart);

export default routerCart;
