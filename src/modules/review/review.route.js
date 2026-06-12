import express from "express";
import {
  createReview,
  getProductReviews,
  getAllReviews,
  deleteReview,
} from "./review.controller.js";
import { authenticateToken, authorizeRole } from "../../shared/middlewares/auth.middleware.js";

const routerReview = express.Router();

routerReview.get("/product/:productId", getProductReviews);

routerReview.post("/", authenticateToken, createReview);

routerReview.delete("/:id", authenticateToken, deleteReview);

routerReview.get("/", authenticateToken, authorizeRole("admin"), getAllReviews);

export default routerReview;
