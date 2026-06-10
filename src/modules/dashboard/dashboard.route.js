import express from "express";
import { getDashboardData } from "./dashboard.controller.js";
import { authenticateToken, authorizeRole } from "../../shared/middlewares/auth.middleware.js";

const routerDashboard = express.Router();

routerDashboard.get(
  "/",
  authenticateToken,
  authorizeRole("admin"),
  getDashboardData
);

export default routerDashboard;
