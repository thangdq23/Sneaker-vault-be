import express from "express";

import authRoutes from "./auth/auth.route.js";
import productRoutes from "./product/product.route.js";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Sneaker Vault API is running.",
  });
});

export default app;
