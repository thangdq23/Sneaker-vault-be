import express from "express";
import {
  addToCart,
  getCart,
  updateCartItem,
  removeCartItem,
  clearCart,
} from "./cart.controller.js";
import { authenticateToken } from "../auth/auth.middleware.js";

const router = express.Router();

router.post("/add", authenticateToken, addToCart);
router.get("/", authenticateToken, getCart);
router.put("/item/:itemId", authenticateToken, updateCartItem);
router.delete("/item/:itemId", authenticateToken, removeCartItem);
router.delete("/clear", authenticateToken, clearCart);

export default router;
