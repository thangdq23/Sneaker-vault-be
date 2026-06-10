import express from "express";
import {
  createOrder,
  getMyOrders,
  getOrderById,
  updateOrderStatus,
  getAllOrders,
  cancelOrder,
} from "./order.controller.js";
import { authenticateToken, authorizeRole } from "../../shared/middlewares/auth.middleware.js";
import { validateRequest } from "../../shared/middlewares/validate.middleware.js";
import { createOrderSchema, updateOrderStatusSchema } from "./order.schema.js";

const routerOrder = express.Router();

routerOrder.post("/", authenticateToken, validateRequest(createOrderSchema), createOrder);
routerOrder.get("/me", authenticateToken, getMyOrders);
routerOrder.get("/:id", authenticateToken, getOrderById);

routerOrder.get("/", authenticateToken, authorizeRole("admin"), getAllOrders);
routerOrder.put(
  "/:id/status",
  authenticateToken,
  authorizeRole("admin"),
  validateRequest(updateOrderStatusSchema),
  updateOrderStatus,
);
routerOrder.patch(
  "/:id/status",
  authenticateToken,
  authorizeRole("admin"),
  validateRequest(updateOrderStatusSchema),
  updateOrderStatus,
);
routerOrder.patch(
  "/:id/cancel",
  authenticateToken,
  cancelOrder,
);

export default routerOrder;
