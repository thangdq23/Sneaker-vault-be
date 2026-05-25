import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "./cart.controller.js";
import { authenticateToken } from "../auth/auth.middleware.js";

const routerCart = express.Router();

routerCart.post("/add", authenticateToken, addToCart);
routerCart.get("/", authenticateToken, getCart);
routerCart.put("/item/:itemId", authenticateToken, updateCartItem);
routerCart.delete("/item/:itemId", authenticateToken, removeCartItem);
routerCart.delete("/clear", authenticateToken, clearCart);

export default routerCart;
