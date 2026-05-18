import express from "express";

import authRoutes from "./auth/auth.route.js";
import productRoutes from "./product/product.route.js";
import cartRoutes from "./cart/cart.route.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/cart", cartRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Sneaker Vault API is running.",
  });
});

export default app;
